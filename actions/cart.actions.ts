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
import type { CartLineItem, CartSummary } from "@/features/cart/types";

async function buildCartSummary(cartId: string | null): Promise<CartSummary> {
  const shippingRate = await getFlatShippingRate();
  if (!cartId) {
    return { items: [], subtotal: 0, itemCount: 0, shippingRate };
  }

  const rows = await db.query.cartItems.findMany({
    where: eq(cartItems.cartId, cartId),
    orderBy: [asc(cartItems.createdAt)],
    with: {
      product: { columns: { name: true, slug: true } },
      variant: true,
    },
  });

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

  const nextQuantity = Math.min(
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

  const cappedQuantity = Math.min(quantity, item.variant?.stockQuantity ?? 0);
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

const COUPON_ERROR = {
  notFound: "This code isn't valid.",
  inactive: "This code is no longer active.",
  notStarted: "This code isn't active yet.",
  expired: "This code has expired.",
  usageLimitReached: "This code has reached its usage limit.",
  minOrderNotMet: (min: string) => `This code requires a minimum order of ${min}.`,
} as const;

/**
 * Re-validates a coupon against live rules at the moment it matters
 * (specs/09) — the applied code is ephemeral client state, never persisted
 * against the cart row.
 */
export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await db.query.coupons.findFirst({
    where: eq(coupons.code, code.trim().toUpperCase()),
  });

  if (!coupon) return { error: COUPON_ERROR.notFound };
  if (!coupon.isActive) return { error: COUPON_ERROR.inactive };

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { error: COUPON_ERROR.notStarted };
  if (coupon.expiresAt && now > coupon.expiresAt) return { error: COUPON_ERROR.expired };
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { error: COUPON_ERROR.usageLimitReached };
  }
  if (coupon.minOrderAmount != null && subtotal < Number(coupon.minOrderAmount)) {
    return { error: COUPON_ERROR.minOrderNotMet(coupon.minOrderAmount) };
  }

  const rawDiscount =
    coupon.type === "percentage" ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value);
  const discountAmount = Math.min(
    coupon.maxDiscountAmount != null ? Math.min(rawDiscount, Number(coupon.maxDiscountAmount)) : rawDiscount,
    subtotal
  );

  return {
    success: true as const,
    code: coupon.code,
    type: coupon.type,
    discountAmount: Math.max(0, discountAmount),
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

    for (const item of guestItems) {
      if (!item.variantId) continue;

      const existing = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.cartId, userCartId), eq(cartItems.variantId, item.variantId)),
      });

      if (existing) {
        const variant = await db.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });
        const cappedQuantity = Math.min(
          existing.quantity + item.quantity,
          variant?.stockQuantity ?? 0
        );
        await db.update(cartItems).set({ quantity: cappedQuantity }).where(eq(cartItems.id, existing.id));
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
