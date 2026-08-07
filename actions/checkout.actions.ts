"use server";

import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  cartItems,
  carts,
  productVariants,
  products,
  coupons,
} from "@/db/schema";
import type { ShippingAddressSnapshot } from "@/db/schema/orders";
import { auth } from "@/lib/auth";
import { getExistingCartId } from "@/lib/cart-session";
import { getSetting } from "@/lib/settings";
import { checkCouponEligibility, calculateDiscountAmount } from "@/lib/coupon";
import { SETTINGS_KEYS } from "@/constants/settings-keys";
import { generateOrderReference } from "@/utils/generate-order-reference";
import { buildWhatsAppLink } from "@/services/whatsapp.service";
import { resend, FROM_EMAIL } from "@/lib/resend";
import OrderConfirmation from "@/emails/order-confirmation";
import { checkoutSchema, type CheckoutInput } from "@/features/checkout/types";
import { saveAddressFromCheckout } from "@/actions/addresses.actions";

/**
 * The most correctness-sensitive operation in the app (specs/10). Neon's
 * HTTP driver doesn't support drizzle's callback-style db.transaction() —
 * db.batch() is Neon's atomic-multi-statement alternative over HTTP, so all
 * validation/reads happen first, then every write lands in one batch: all
 * succeed together or none do.
 */
export async function placeOrder(input: CheckoutInput) {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form for errors." };
  }
  const data = parsed.data;

  const cartId = await getExistingCartId();
  if (!cartId) return { error: "Your cart is empty." };

  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.cartId, cartId),
    with: { product: { columns: { id: true, name: true } }, variant: true },
  });
  if (items.length === 0) return { error: "Your cart is empty." };

  // 1. Re-validate stock and current price server-side — never trust the client.
  for (const item of items) {
    if (!item.variant) {
      return { error: `${item.product?.name ?? "An item"} is no longer available. Please remove it from your cart.` };
    }
    if (item.variant.stockQuantity < item.quantity) {
      return {
        error: `Only ${item.variant.stockQuantity} of "${item.product?.name}" (${item.variant.name}) left — please update your cart.`,
      };
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.variant!.price) * item.quantity,
    0
  );

  // 2. Re-validate the coupon against the live subtotal.
  let discountAmount = 0;
  let couponRow: typeof coupons.$inferSelect | null = null;
  if (data.couponCode) {
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.code, data.couponCode.trim().toUpperCase()),
    });
    if (!coupon) return { error: "The applied coupon is no longer valid." };

    const eligibilityError = checkCouponEligibility(coupon, subtotal, new Date());
    if (eligibilityError) return { error: `The applied coupon ${eligibilityError.detail}.` };

    discountAmount = calculateDiscountAmount(coupon, subtotal);
    couponRow = coupon;
  }

  const shippingAmount = await getSetting(SETTINGS_KEYS.flatShippingRatePkr);
  const totalAmount = Math.max(0, subtotal - discountAmount) + Number(shippingAmount);

  const orderReference = await generateOrderReference();
  const orderId = crypto.randomUUID();

  const session = await auth.api.getSession({ headers: await headers() });

  const shippingAddress: ShippingAddressSnapshot = {
    fullName: data.fullName,
    phone: data.phone,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
  };

  const paymentStatus = data.paymentMethod === "cod" ? "cod_pending" : "awaiting_confirmation";

  // 3. Every write lands in one atomic batch — order, items, stock
  // decrements, coupon usage, and clearing the cart all succeed together.
  const writes = [
    db.insert(orders).values({
      id: orderId,
      orderReference,
      userId: session?.user?.id,
      status: "pending",
      paymentMethod: data.paymentMethod,
      paymentStatus,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingAddress,
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      shippingAmount,
      totalAmount: totalAmount.toFixed(2),
      couponId: couponRow?.id,
    }),
    db.insert(orderItems).values(
      items.map((item) => ({
        orderId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product?.name ?? "Product",
        variantName: item.variant!.name,
        unitPrice: item.variant!.price,
        quantity: item.quantity,
        totalPrice: (Number(item.variant!.price) * item.quantity).toFixed(2),
      }))
    ),
    ...items.map((item) =>
      db
        .update(productVariants)
        .set({ stockQuantity: sql`${productVariants.stockQuantity} - ${item.quantity}` })
        .where(eq(productVariants.id, item.variantId!))
    ),
    // Feeds the admin dashboard's Top Selling Products chart (specs/13) —
    // without this, salesCount would stay frozen at whatever seed data set
    // it and never reflect real orders.
    ...items.map((item) =>
      db
        .update(products)
        .set({ salesCount: sql`${products.salesCount} + ${item.quantity}` })
        .where(eq(products.id, item.productId))
    ),
    ...(couponRow
      ? [db.update(coupons).set({ usageCount: sql`${coupons.usageCount} + 1` }).where(eq(coupons.id, couponRow.id))]
      : []),
    db.delete(cartItems).where(eq(cartItems.cartId, cartId)),
    db.delete(carts).where(eq(carts.id, cartId)),
  ] as const;

  await db.batch(writes as unknown as Parameters<typeof db.batch>[0]);

  if (data.saveAddress && session?.user) {
    await saveAddressFromCheckout({
      fullName: data.fullName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
    });
  }

  // Best-effort — a failed email should never undo an already-committed order.
  try {
    const [easypaisaNumber, jazzcashNumber, whatsappNumber] = await Promise.all([
      getSetting(SETTINGS_KEYS.easypaisaNumber),
      getSetting(SETTINGS_KEYS.jazzcashNumber),
      getSetting(SETTINGS_KEYS.whatsappBusinessNumber),
    ]);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmed — ${orderReference}`,
      react: OrderConfirmation({
        customerName: data.customerName,
        orderReference,
        items: items.map((item) => ({
          productName: item.product?.name ?? "Product",
          variantName: item.variant!.name,
          quantity: item.quantity,
          totalPrice: (Number(item.variant!.price) * item.quantity).toFixed(2),
        })),
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        shippingAmount,
        totalAmount: totalAmount.toFixed(2),
        paymentMethod: data.paymentMethod,
        easypaisaNumber,
        jazzcashNumber,
        whatsappLink:
          data.paymentMethod === "manual_transfer"
            ? buildWhatsAppLink(whatsappNumber, orderReference)
            : undefined,
      }),
    });
  } catch (error) {
    console.error("Order confirmation email failed:", error);
  }

  return { success: true as const, orderId };
}
