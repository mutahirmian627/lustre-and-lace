"use server";

import { headers, cookies } from "next/headers";
import { z } from "zod";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { carts, cartItems, productVariants, productImages, coupons } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getOrCreateCartId, getExistingCartId, GUEST_CART_COOKIE } from "@/lib/cart-session";
import { getFlatShippingRate } from "@/lib/settings";
import { checkCouponEligibility, calculateDiscountAmount } from "@/lib/coupon";
import { mergeCartItems, type MergeableCartItem } from "@/lib/cart-merge";
import { capQuantityToStock } from "@/utils/stock";
import type { CartLineItem, CartSummary } from "@/features/cart/types";

async function buildCartSummary(cartId: string | null): Promise<CartSummary> {
  if (!cartId) {
    return { items: [], subtotal: 0, itemCount: 0, shippingRate: await getFlatShippingRate() };
  }

  const [shippingRate, rows] = await Promise.all([
    getFlatShippingRate(),
    db.query.cartItems.findMany({
      where: eq(cartItems.cartId, cartId),
      orderBy: [asc(cartItems.createdAt)],
      with: {
        product: { columns: { name: true, slug: true } },
        variant: true,
      },
    }),
  ]);

  const productIds = rows.map((r) => r.productId);
  const images = productIds.length
    ? await db.query.productImages.findMany({
        where: inArray(productImages.productId, productIds),
        columns: { productId: true, variantId: true, url: true, isPrimary: true, displayOrder: true },
        orderBy: [desc(productImages.isPrimary), asc(productImages.displayOrder)],
      })
    : [];

  function imageFor(productId: string, variantId: string | null) {
    const variantImage = variantId && images.find((img) => img.variantId === variantId);
    if (variantImage) return variantImage.url;
    return images.find((img) => img.productId === productId && !img.variantId)?.url ?? null;
  }

  const items: CartLineItem[] = rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    productSlug: row.product?.slug ?? "",
    productName: row.product?.name ?? "Product",
    variantId: row.variantId ?? "",
    variantName: row.variant?.name ?? "",
    imageUrl: imageFor(row.productId, row.variantId),
    quantity: row.quantity,
    priceAtAdd: row.priceAtAdd,
    currentPrice: row.variant?.price ?? row.priceAtAdd,
    stockQuantity: row.variant?.stockQuantity ?? 0,
  }));

  const subtotal = items.reduce((sum, item) => sum + Number(item.currentPrice) * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, subtotal, itemCount, shippingRate };
}

export async function getCart(): Promise<CartSummary> {
  const cartId = await getExistingCartId();
  return buildCartSummary(cartId);
}

/** Header badge count. Reads only — never creates a cart just to display a "0". */
export async function getCartItemCount() {
  const cartId = await getExistingCartId();
  if (!cartId) return 0;

  const [{ total }] = await db
    .select({ total: sql<number>`coalesce(sum(${cartItems.quantity}), 0)::int` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId));
  return total;
}

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

/**
 * Real add-to-cart mutation the PDP/wishlist buttons call. Returns the full
 * cart summary so CartProvider can update from the response directly,
 * without a second round trip (specs/09).
 */
export async function addToCart(
  input: z.infer<typeof addToCartSchema>
): Promise<{ error: string } | { success: true; cart: CartSummary }> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, parsed.data.variantId),
  });
  if (!variant) {
    return { error: "This variant no longer exists." };
  }
  if (variant.stockQuantity <= 0) {
    return { error: "This item is out of stock." };
  }

  const cartId = await getOrCreateCartId();

  const existingItem = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, parsed.data.variantId)),
  });

  const nextQuantity = capQuantityToStock(
    (existingItem?.quantity ?? 0) + parsed.data.quantity,
    variant.stockQuantity
  );

  if (existingItem) {
    await db.update(cartItems).set({ quantity: nextQuantity }).where(eq(cartItems.id, existingItem.id));
  } else {
    await db.insert(cartItems).values({
      cartId,
      productId: parsed.data.productId,
      variantId: parsed.data.variantId,
      quantity: nextQuantity,
      priceAtAdd: variant.price,
    });
  }

  revalidatePath("/", "layout");
  return { success: true, cart: await buildCartSummary(cartId) };
}

/** Capped at current stock, per specs/09's stock-validation rule. */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<{ error: string } | { success: true; cart: CartSummary }> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "Invalid quantity." };
  }

  const cartId = await getExistingCartId();
  if (!cartId) return { error: "Your cart could not be found." };

  const item = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)),
    with: { variant: true },
  });
  if (!item) return { error: "This item is no longer in your cart." };

  const cappedQuantity = capQuantityToStock(quantity, item.variant?.stockQuantity ?? 0);
  await db.update(cartItems).set({ quantity: cappedQuantity }).where(eq(cartItems.id, itemId));

  revalidatePath("/", "layout");
  return { success: true, cart: await buildCartSummary(cartId) };
}

export async function removeCartItem(
  itemId: string
): Promise<{ success: true; cart: CartSummary }> {
  const cartId = await getExistingCartId();
  if (cartId) {
    await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
  }

  revalidatePath("/", "layout");
  return { success: true, cart: await buildCartSummary(cartId) };
}

const COUPON_NOT_FOUND_ERROR = "This code isn't valid.";

/**
 * Re-validates a coupon against live rules at the moment it matters
 * (specs/09) — the applied code is ephemeral client state, never persisted
 * against the cart row.
 */
export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await db.query.coupons.findFirst({
    where: eq(coupons.code, code.trim().toUpperCase()),
  });
  if (!coupon) return { error: COUPON_NOT_FOUND_ERROR };

  const eligibilityError = checkCouponEligibility(coupon, subtotal, new Date());
  if (eligibilityError) return { error: `This code ${eligibilityError.detail}.` };

  return {
    success: true as const,
    code: coupon.code,
    type: coupon.type,
    discountAmount: calculateDiscountAmount(coupon, subtotal),
  };
}

/**
 * Fires from the client right after a successful signIn/signUp
 * (specs/03's cross-cutting cart-merge behavior). Sums overlapping
 * (productId, variantId) quantities capped at stock; non-overlapping items
 * are added as-is; the guest cart and its cookie are cleared afterward.
 */
export async function mergeGuestCart() {
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!guestToken) return;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return;

  const guestCart = await db.query.carts.findFirst({ where: eq(carts.guestToken, guestToken) });
  if (!guestCart) {
    cookieStore.delete(GUEST_CART_COOKIE);
    return;
  }

  const guestItems = await db.query.cartItems.findMany({ where: eq(cartItems.cartId, guestCart.id) });

  if (guestItems.length > 0) {
    const userCartId = await getOrCreateCartId();
    const userItems = await db.query.cartItems.findMany({ where: eq(cartItems.cartId, userCartId) });

    const toMergeable = (item: { variantId: string | null; productId: string; quantity: number; priceAtAdd: string }): MergeableCartItem | null =>
      item.variantId ? { variantId: item.variantId, productId: item.productId, quantity: item.quantity, priceAtAdd: item.priceAtAdd } : null;

    const guestMergeable = guestItems.map(toMergeable).filter((i): i is MergeableCartItem => i !== null);
    const userMergeable = userItems.map(toMergeable).filter((i): i is MergeableCartItem => i !== null);

    const variantIds = [...new Set(guestMergeable.map((i) => i.variantId))];
    const variants = variantIds.length
      ? await db.query.productVariants.findMany({ where: inArray(productVariants.id, variantIds) })
      : [];
    const stockByVariantId = new Map(variants.map((v) => [v.id, v.stockQuantity]));

    const merged = mergeCartItems(guestMergeable, userMergeable, stockByVariantId);
    const existingUserVariantIds = new Set(userMergeable.map((i) => i.variantId));

    for (const item of merged) {
      if (existingUserVariantIds.has(item.variantId)) {
        await db
          .update(cartItems)
          .set({ quantity: item.quantity })
          .where(and(eq(cartItems.cartId, userCartId), eq(cartItems.variantId, item.variantId)));
      } else {
        await db.insert(cartItems).values({
          cartId: userCartId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtAdd: item.priceAtAdd,
        });
      }
    }
  }

  await db.delete(carts).where(eq(carts.id, guestCart.id));
  cookieStore.delete(GUEST_CART_COOKIE);
  revalidatePath("/", "layout");
}
