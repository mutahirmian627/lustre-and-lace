import { cache } from "react";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  gt,
  gte,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  productImages,
  products,
  productVariants,
} from "@/db/schema";
import type {
  FilterFacets,
  ProductFilters,
  ProductListItem,
} from "@/features/products/types";
import { PAGE_SIZE } from "@/features/products/types";

/**
 * Resolves a category slug to itself + its direct children's ids (specs/06: capped at two levels, no recursive CTE).
 * One round trip: the slug row and its children come back together.
 */
async function resolveCategoryIds(categorySlug: string) {
  const rows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(
      or(
        eq(categories.slug, categorySlug),
        inArray(
          categories.parentId,
          db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug))
        )
      )
    );

  if (!rows.some((row) => row.slug === categorySlug)) return null;
  return rows.map((row) => row.id);
}

function variantAttributeExists(key: string, values: string[]) {
  return exists(
    db
      .select({ one: sql`1` })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, products.id),
          inArray(sql`${productVariants.attributes}->>${key}`, values)
        )
      )
  );
}

function inStockVariantExists() {
  return exists(
    db
      .select({ one: sql`1` })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, products.id),
          gt(productVariants.stockQuantity, 0)
        )
      )
  );
}

/** Every filter except full-text search — shared by getProducts and searchProducts. */
async function buildFilterConditions(filters: ProductFilters) {
  const conditions = [eq(products.isActive, true)];

  if (filters.categorySlug) {
    const categoryIds = await resolveCategoryIds(filters.categorySlug);
    if (!categoryIds) return null;
    conditions.push(inArray(products.categoryId, categoryIds));
  }

  if (filters.minPrice != null) {
    conditions.push(gte(products.basePrice, String(filters.minPrice)));
  }
  if (filters.maxPrice != null) {
    conditions.push(lte(products.basePrice, String(filters.maxPrice)));
  }
  if (filters.minRating != null) {
    conditions.push(gte(products.ratingAverage, String(filters.minRating)));
  }
  if (filters.plating?.length) {
    conditions.push(variantAttributeExists("plating", filters.plating));
  }
  if (filters.color?.length) {
    conditions.push(variantAttributeExists("color", filters.color));
  }
  if (filters.size?.length) {
    conditions.push(variantAttributeExists("size", filters.size));
  }
  if (filters.inStockOnly) {
    conditions.push(inStockVariantExists());
  }
  if (filters.onSale) {
    conditions.push(sql`${products.compareAtPrice} > ${products.basePrice}`);
  }

  return conditions;
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
  // Primary image resolved in the same query (correlated subquery) — each
  // query is a separate HTTPS round trip to Neon, so a follow-up lookup would
  // add a full network wait to every listing. Columns are hand-qualified
  // because Drizzle drops table prefixes for single-table selects.
  imageUrl: sql<string | null>`(
    select pi.url
    from product_images pi
    where pi.product_id = products.id
    order by pi.is_primary desc, pi.display_order asc
    limit 1
  )`,
};

const SORT_ORDER_BY = {
  newest: [desc(products.createdAt)],
  price_asc: [asc(products.basePrice)],
  price_desc: [desc(products.basePrice)],
  best_selling: [desc(products.salesCount)],
  top_rated: [desc(products.ratingAverage)],
};

export async function getProducts(
  filters: ProductFilters
): Promise<{ items: ProductListItem[]; total: number; totalPages: number }> {
  const conditions = await buildFilterConditions(filters);
  if (!conditions) return { items: [], total: 0, totalPages: 0 };

  const where = and(...conditions);
  const page = Math.max(1, filters.page ?? 1);
  const orderBy = SORT_ORDER_BY[filters.sort as keyof typeof SORT_ORDER_BY] ?? SORT_ORDER_BY.newest;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select(LISTING_COLUMNS)
      .from(products)
      .where(where)
      .orderBy(...orderBy)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ]);

  return { items: rows, total: count, totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)) };
}

/**
 * Postgres full-text search over the searchVector column (specs/07) — not
 * modeled in db/schema/products.ts (see db/migrations/0001), so it's
 * referenced here via a raw sql fragment rather than a typed column.
 * websearch_to_tsquery tolerates natural typed-in phrasing better than a
 * strict to_tsquery would.
 */
export async function searchProducts(
  query: string,
  filters: ProductFilters
): Promise<{ items: ProductListItem[]; total: number; totalPages: number }> {
  const conditions = await buildFilterConditions(filters);
  if (!conditions) return { items: [], total: 0, totalPages: 0 };

  const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
  conditions.push(sql`"products"."search_vector" @@ ${tsQuery}`);
  const where = and(...conditions);

  const page = Math.max(1, filters.page ?? 1);
  const orderBy =
    filters.sort && filters.sort !== "relevance"
      ? SORT_ORDER_BY[filters.sort as keyof typeof SORT_ORDER_BY] ?? SORT_ORDER_BY.newest
      : [desc(sql`ts_rank("products"."search_vector", ${tsQuery})`)];

  const [rows, [{ count }]] = await Promise.all([
    db
      .select(LISTING_COLUMNS)
      .from(products)
      .where(where)
      .orderBy(...orderBy)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
  ]);

  return { items: rows, total: count, totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)) };
}

/** Live suggestions for the search overlay — top 5 matches, ranked by relevance. */
export async function getSearchSuggestions(query: string, limit = 5) {
  if (!query.trim()) return [];

  const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
  const rows = await db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(and(eq(products.isActive, true), sql`"products"."search_vector" @@ ${tsQuery}`))
    .orderBy(desc(sql`ts_rank("products"."search_vector", ${tsQuery})`))
    .limit(limit);

  return rows;
}

/** Facet bounds/options scoped to a category, so filter UIs never show a dead checkbox (specs/06). */
export async function getFilterFacets(categorySlug?: string): Promise<FilterFacets> {
  const conditions = [eq(products.isActive, true)];
  if (categorySlug) {
    const categoryIds = await resolveCategoryIds(categorySlug);
    if (!categoryIds) {
      return { minPrice: 0, maxPrice: 0, plating: [], color: [], size: [] };
    }
    conditions.push(inArray(products.categoryId, categoryIds));
  }

  const [priceBounds, variantRows] = await Promise.all([
    db
      .select({
        min: sql<string>`min(${products.basePrice})`,
        max: sql<string>`max(${products.basePrice})`,
      })
      .from(products)
      .where(and(...conditions)),
    db
      .select({ attributes: productVariants.attributes })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(...conditions)),
  ]);

  const plating = new Set<string>();
  const color = new Set<string>();
  const size = new Set<string>();
  for (const row of variantRows) {
    const attrs = row.attributes;
    if (attrs.plating) plating.add(attrs.plating);
    if (attrs.color) color.add(attrs.color);
    if (attrs.size) size.add(attrs.size);
  }

  return {
    minPrice: Math.floor(Number(priceBounds[0]?.min ?? 0)),
    maxPrice: Math.ceil(Number(priceBounds[0]?.max ?? 0)),
    plating: [...plating],
    color: [...color],
    size: [...size],
  };
}

/** Deduped per request: generateMetadata and the page both fetch the same product. */
export const getProductBySlug = cache(async (slug: string) => {
  // Reviews are looked up by slug through a subquery so both queries start
  // together — waiting for the product id first would add a full round trip.
  const [product, reviews] = await Promise.all([
    db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.isActive, true)),
      with: {
        category: true,
        variants: { orderBy: [desc(productVariants.isDefault)] },
        images: { orderBy: [asc(productImages.displayOrder)] },
      },
    }),
    db.query.reviews.findMany({
      where: (reviews, { eq, and, isNull, inArray }) =>
        and(
          inArray(
            reviews.productId,
            db
              .select({ id: products.id })
              .from(products)
              .where(and(eq(products.slug, slug), eq(products.isActive, true)))
          ),
          eq(reviews.isApproved, true),
          isNull(reviews.deletedAt)
        ),
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
      with: { user: { columns: { name: true } } },
    }),
  ]);
  if (!product) return null;

  return { ...product, reviews };
});

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 8
) {
  const rows = await db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
        sql`${products.id} != ${excludeProductId}`
      )
    )
    .limit(limit);

  return rows;
}

export async function getProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];

  const rows = await db
    .select(LISTING_COLUMNS)
    .from(products)
    .where(and(inArray(products.slug, slugs), eq(products.isActive, true)));

  const items: ProductListItem[] = rows;
  // Preserve the caller's order (used by RecentlyViewed, ordered most-recent-first).
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  return slugs.map((slug) => bySlug.get(slug)).filter((item): item is ProductListItem => !!item);
}
