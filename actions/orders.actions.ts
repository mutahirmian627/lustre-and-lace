"use server";

import { headers } from "next/headers";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, productVariants, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { applyCancellationSideEffects } from "@/lib/order-cancellation";
import { addToCart } from "@/actions/cart.actions";
import { resend, FROM_EMAIL } from "@/lib/resend";
import OrderCancelled from "@/emails/order-cancelled";

const ORDERS_PER_PAGE = 10;

/**
 * Used by the checkout confirmation page right after placeOrder redirects
 * here. Orders always belong to an account now, so only the owner can view it.
 */
export async function getOrderById(orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
  if (!order || order.userId !== session.user.id) return null;
  return order;
}

/** Paginated order history for the logged-in customer (specs/11). */
export async function getOrdersForUser(page = 1) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { orders: [], totalPages: 0, totalCount: 0 };

  const offset = (page - 1) * ORDERS_PER_PAGE;

  const [rows, [{ count }]] = await Promise.all([
    db.query.orders.findMany({
      where: eq(orders.userId, session.user.id),
      orderBy: [desc(orders.createdAt)],
      limit: ORDERS_PER_PAGE,
      offset,
      with: { items: true },
    }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.userId, session.user.id)),
  ]);

  return { orders: rows, totalPages: Math.ceil(count / ORDERS_PER_PAGE), totalCount: count };
}

/** Order detail for the account area — enforces that the viewer owns the order. */
export async function getOrderForAccount(orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: { with: { product: { columns: { slug: true } } } } },
  });
  if (!order || order.userId !== session.user.id) return null;
  return order;
}

/**
 * Public guest lookup (specs/11) — reference + email required together so a
 * guessed order reference alone can't be used to browse someone else's order.
 */
export async function trackGuestOrder(reference: string, email: string) {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.orderReference, reference.trim().toUpperCase()),
      eq(orders.customerEmail, email.trim().toLowerCase())
    ),
    with: { items: true },
  });

  if (!order) {
    return { success: false as const, error: "No order found matching that reference and email." };
  }
  return { success: true as const, error: null, order };
}

/**
 * Self-service cancellation — restricted to `pending` orders (specs/11);
 * once fulfillment work has started (`processing`) the customer has to
 * reach out via WhatsApp/contact instead.
 */
export async function cancelOrder(orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "You must be signed in to cancel an order." };

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
  if (!order || order.userId !== session.user.id) {
    return { error: "Order not found." };
  }
  if (order.status !== "pending") {
    return { error: "This order can no longer be cancelled — please contact us for help." };
  }

  await applyCancellationSideEffects(order);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customerEmail,
      subject: `Order Cancelled — ${order.orderReference}`,
      react: OrderCancelled({
        customerName: order.customerName,
        orderReference: order.orderReference,
        items: order.items.map((item) => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        })),
        totalAmount: order.totalAmount,
        wasRefunded: order.paymentStatus === "paid",
      }),
    });
  } catch (error) {
    console.error("Order cancellation email failed:", error);
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return { success: true as const };
}

/**
 * Adds every line item back into the cart, matching by variant. Items whose
 * variant no longer exists, belongs to an inactive/deleted product, or is
 * out of stock are skipped rather than blocking the whole reorder — mirrors
 * the wishlist's "Add All to Cart" summary pattern (specs/08).
 */
export async function reorderItems(orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "You must be signed in to reorder." };

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
  if (!order || order.userId !== session.user.id) {
    return { error: "Order not found." };
  }

  let added = 0;
  let skipped = 0;

  for (const item of order.items) {
    if (!item.variantId || !item.productId) {
      skipped++;
      continue;
    }

    const [variant] = await db
      .select({
        stockQuantity: productVariants.stockQuantity,
        productIsActive: products.isActive,
        productDeletedAt: products.deletedAt,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(productVariants.id, item.variantId));

    if (!variant || !variant.productIsActive || variant.productDeletedAt || variant.stockQuantity <= 0) {
      skipped++;
      continue;
    }

    const quantity = Math.min(item.quantity, variant.stockQuantity);
    const result = await addToCart({ productId: item.productId, variantId: item.variantId, quantity });
    if ("error" in result) skipped++;
    else added++;
  }

  return { added, skipped };
}
