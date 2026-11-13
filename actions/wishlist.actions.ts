"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { wishlists } from "@/db/schema";
import { getSession } from "@/lib/session";
import { addToCart } from "@/actions/cart.actions";

async function requireSession() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function getWishlistProductIds(): Promise<string[]> {
  const user = await requireSession();
  if (!user) return [];

  const rows = await db.query.wishlists.findMany({
    where: eq(wishlists.userId, user.id),
    columns: { productId: true },
  });
  return rows.map((r) => r.productId);
}

/** Optimistic toggle target — the client flips its own state first, this just confirms/persists. */
export async function toggleWishlist(productId: string) {
  const user = await requireSession();
  if (!user) {
    return { error: "sign_in_required" as const };
  }

  const existing = await db.query.wishlists.findFirst({
    where: and(eq(wishlists.userId, user.id), eq(wishlists.productId, productId)),
  });

  if (existing) {
    await db.delete(wishlists).where(eq(wishlists.id, existing.id));
    revalidatePath("/shop/wishlist");
    return { wishlisted: false as const };
  }

  await db.insert(wishlists).values({ userId: user.id, productId });
  revalidatePath("/shop/wishlist");
  return { wishlisted: true as const };
}

export async function getWishlist() {
  const user = await requireSession();
  if (!user) return [];

  return db.query.wishlists.findMany({
    where: eq(wishlists.userId, user.id),
    orderBy: (w, { desc }) => [desc(w.createdAt)],
    with: {
      product: {
        with: {
          variants: true,
          images: { orderBy: (img, { asc }) => [asc(img.displayOrder)] },
        },
      },
    },
  });
}

/** Adds every in-stock item's default variant, skipping out-of-stock items, in one summary action. */
export async function addAllWishlistToCart() {
  const items = await getWishlist();
  if (items.length === 0) {
    return { added: 0, skipped: 0 };
  }

  let added = 0;
  let skipped = 0;

  for (const item of items) {
    const variant =
      item.product.variants.find((v) => v.isDefault) ?? item.product.variants[0];
    if (!variant || variant.stockQuantity <= 0) {
      skipped++;
      continue;
    }
    const result = await addToCart({ productId: item.product.id, variantId: variant.id, quantity: 1 });
    if ("error" in result) skipped++;
    else added++;
  }

  return { added, skipped };
}
