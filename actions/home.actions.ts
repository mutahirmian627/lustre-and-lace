import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { products, reviews, wishlists, categories, productImages } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { ProductListItem } from "@/features/products/types";

async function withPrimaryImages(
  rows: Omit<ProductListItem, "imageUrl">[]
): Promise<ProductListItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const images = await db.query.productImages.findMany({
    where: (img, { inArray }) => inArray(img.productId, ids),
    columns: { productId: true, url: true, isPrimary: true, displayOrder: true },
    orderBy: [desc(productImages.isPrimary), asc(productImages.displayOrder)],
  });
  const byProduct = new Map<string, string>();
  for (const img of images) {
    if (!byProduct.has(img.productId)) byProduct.set(img.productId, img.url);
  }
  return rows.map((r) => ({ ...r, imageUrl: byProduct.get(r.id) ?? null }));
}

const LISTING_COLUMNS = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  basePrice: products.basePrice,
  compareAtPrice: products.compareAtPrice,
  ratingAverage: products.ratingAverage,
  ratingCount: products.ratingCount,
  isTrending: products.isTrending,
};

export async function getNewArrivals(limit = 10) {
  const rows = await db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return withPrimaryImages(rows);
}

/** Admin-curated, not analytics-derived — see products.isTrending (specs/05). */
export async function getTrendingProducts(limit = 10) {
  const rows = await db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isTrending, true)))
    .orderBy(desc(products.updatedAt))
    .limit(limit);
  return withPrimaryImages(rows);
}

/** Ordered by the maintained salesCount counter, not a live orderItems aggregate (specs/02, specs/05). */
export async function getBestSellers(limit = 10) {
  const rows = await db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.salesCount))
    .limit(limit);
  return withPrimaryImages(rows);
}

export async function getFeaturedCategories(limit = 8) {
  return db.query.categories.findMany({
    where: (c, { and, isNull, eq }) => and(isNull(c.parentId), eq(c.isActive, true)),
    orderBy: [asc(categories.displayOrder)],
    limit,
  });
}

/** Curated for homepage positivity (rating >= 4); PDPs still show the full unfiltered set (specs/05). */
export async function getHomepageReviews(limit = 8) {
  return db.query.reviews.findMany({
    where: and(eq(reviews.isApproved, true), gte(reviews.rating, 4)),
    orderBy: [desc(reviews.createdAt)],
    limit,
    with: { user: { columns: { name: true } }, product: { columns: { name: true, slug: true } } },
  });
}

export async function getWishlistCount() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return 0;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(wishlists)
    .where(eq(wishlists.userId, session.user.id));
  return count;
}
