import { and, asc, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews, categories } from "@/db/schema";

/**
 * Primary image resolved in the same query (correlated subquery) rather than
 * a follow-up lookup — each query is a separate HTTPS round trip to Neon, so
 * folding it in halves the latency of every homepage product row.
 */
const LISTING_COLUMNS = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  basePrice: products.basePrice,
  compareAtPrice: products.compareAtPrice,
  ratingAverage: products.ratingAverage,
  ratingCount: products.ratingCount,
  isTrending: products.isTrending,
  // Columns are written out and qualified by hand: Drizzle drops table
  // prefixes for single-table selects, which would make `id` ambiguous here.
  imageUrl: sql<string | null>`(
    select pi.url
    from product_images pi
    where pi.product_id = products.id
    order by pi.is_primary desc, pi.display_order asc
    limit 1
  )`,
};

export async function getNewArrivals(limit = 8) {
  return db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

/** Admin-curated, not analytics-derived — see products.isTrending (specs/05). */
export async function getTrendingProducts(limit = 8) {
  return db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isTrending, true)))
    .orderBy(desc(products.updatedAt))
    .limit(limit);
}

/** Ordered by the maintained salesCount counter, not a live orderItems aggregate (specs/02, specs/05). */
export async function getBestSellers(limit = 8) {
  return db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.salesCount))
    .limit(limit);
}

/** Biggest percentage discounts first, so the home page leads with the best offers. */
export async function getSaleProducts(limit = 6) {
  return db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(and(eq(products.isActive, true), sql`${products.compareAtPrice} > ${products.basePrice}`))
    .orderBy(desc(sql`(${products.compareAtPrice} - ${products.basePrice}) / ${products.compareAtPrice}`))
    .limit(limit);
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
    where: and(eq(reviews.isApproved, true), gte(reviews.rating, 4), isNull(reviews.deletedAt)),
    orderBy: [desc(reviews.createdAt)],
    limit,
    with: { user: { columns: { name: true } }, product: { columns: { name: true, slug: true } } },
  });
}
