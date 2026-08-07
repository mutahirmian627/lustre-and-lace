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

/** Resolves a category slug to itself + its direct children's ids (specs/06: capped at two levels, no recursive CTE). */
async function resolveCategoryIds(categorySlug: string) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, categorySlug),
  });
  if (!category) return null;

  const children = await db.query.categories.findMany({
    where: eq(categories.parentId, category.id),
    columns: { id: true },
  });

  return [category.id, ...children.map((c) => c.id)];
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

async function attachPrimaryImages(
  items: Omit<ProductListItem, "imageUrl">[]
): Promise<ProductListItem[]> {
  if (items.length === 0) return [];

  const ids = items.map((item) => item.id);
  const images = await db.query.productImages.findMany({
    where: inArray(productImages.productId, ids),
    columns: { productId: true, url: true, isPrimary: true, displayOrder: true },
    orderBy: [desc(productImages.isPrimary), asc(productImages.displayOrder)],
  });

  const imageByProduct = new Map<string, string>();
  for (const image of images) {
    if (!imageByProduct.has(image.productId)) {
      imageByProduct.set(image.productId, image.url);
    }
  }

  return items.map((item) => ({
    ...item,
    imageUrl: imageByProduct.get(item.id) ?? null,
  }));
}

export async function getProducts(
  filters: ProductFilters
): Promise<{ items: ProductListItem[]; total: number; totalPages: number }> {
  const conditions = [eq(products.isActive, true)];

  if (filters.categorySlug) {
    const categoryIds = await resolveCategoryIds(filters.categorySlug);
    if (!categoryIds) return { items: [], total: 0, totalPages: 0 };
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

  const where = and(...conditions);
  const page = Math.max(1, filters.page ?? 1);

  const orderBy = {
    newest: [desc(products.createdAt)],
    price_asc: [asc(products.basePrice)],
    price_desc: [desc(products.basePrice)],
    best_selling: [desc(products.salesCount)],
    top_rated: [desc(products.ratingAverage)],
  }[filters.sort ?? "newest"];

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        compareAtPrice: products.compareAtPrice,
        ratingAverage: products.ratingAverage,
        ratingCount: products.ratingCount,
        isTrending: products.isTrending,
      })
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

  const items = await attachPrimaryImages(rows);

  return { items, total: count, totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)) };
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

export async function getProductBySlug(slug: string) {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    with: {
      category: true,
      variants: { orderBy: [desc(productVariants.isDefault)] },
      images: { orderBy: [asc(productImages.displayOrder)] },
    },
  });
  if (!product) return null;

  const reviews = await db.query.reviews.findMany({
    where: (reviews, { eq, and }) =>
      and(eq(reviews.productId, product.id), eq(reviews.isApproved, true)),
    orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    with: { user: { columns: { name: true } } },
  });

  return { ...product, reviews };
}

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 8
) {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      ratingAverage: products.ratingAverage,
      ratingCount: products.ratingCount,
      isTrending: products.isTrending,
    })
    .from(products)
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
        sql`${products.id} != ${excludeProductId}`
      )
    )
    .limit(limit);

  return attachPrimaryImages(rows);
}

export async function getProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      ratingAverage: products.ratingAverage,
      ratingCount: products.ratingCount,
      isTrending: products.isTrending,
    })
    .from(products)
    .where(and(inArray(products.slug, slugs), eq(products.isActive, true)));

  const items = await attachPrimaryImages(rows);
  // Preserve the caller's order (used by RecentlyViewed, ordered most-recent-first).
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  return slugs.map((slug) => bySlug.get(slug)).filter((item): item is ProductListItem => !!item);
}
