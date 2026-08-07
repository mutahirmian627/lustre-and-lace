"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cartItems, productVariants } from "@/db/schema";
import { getOrCreateCartId } from "@/lib/cart-session";

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

/**
 * Minimal, real add-to-cart slice built alongside the PDP so its button
 * isn't a placeholder. The full cart experience (drawer, /cart page,
 * Context provider, guest/login merge, coupons) is specs/09 — this action
 * is the same "resolve a cart, upsert an item, cap at stock" primitive
 * that milestone extends, not a stand-in for it.
 */
export async function addToCart(input: z.infer<typeof addToCartSchema>) {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid request." as const };
  }

  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, parsed.data.variantId),
  });
  if (!variant) {
    return { error: "This variant no longer exists." as const };
  }
  if (variant.stockQuantity <= 0) {
    return { error: "This item is out of stock." as const };
  }

  const cartId = await getOrCreateCartId();

  const existingItem = await db.query.cartItems.findFirst({
    where: and(
      eq(cartItems.cartId, cartId),
      eq(cartItems.variantId, parsed.data.variantId)
    ),
  });

  const nextQuantity = Math.min(
    (existingItem?.quantity ?? 0) + parsed.data.quantity,
    variant.stockQuantity
  );

  if (existingItem) {
    await db
      .update(cartItems)
      .set({ quantity: nextQuantity })
      .where(eq(cartItems.id, existingItem.id));
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
  return { success: true as const, quantity: nextQuantity };
}
