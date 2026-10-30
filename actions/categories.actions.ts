import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";

export const CATEGORIES_CACHE_TAG = "categories";

/**
 * Every active category in one query. The header, footer and mobile nav need
 * this on every storefront page and it changes only when an admin edits
 * categories, so it's cached across requests and invalidated by the tag in
 * actions/admin/categories.actions.ts. Only plain columns are selected —
 * unstable_cache serializes to JSON, which would turn Date columns into strings.
 */
const getActiveCategoryRows = unstable_cache(
  async () =>
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.displayOrder)),
  ["active-category-rows-v2"],
  { tags: [CATEGORIES_CACHE_TAG], revalidate: 3600 }
);

export async function getTopLevelCategories() {
  const rows = await getActiveCategoryRows();
  return rows.filter((c) => c.parentId === null);
}

/** Deduped per request: both generateMetadata and the page call this for the same slug. */
export const getCategoryBySlug = cache(async (slug: string) => {
  const category = await db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), eq(categories.isActive, true)),
  });
  if (!category) return null;

  const children = await db.query.categories.findMany({
    where: and(eq(categories.parentId, category.id), eq(categories.isActive, true)),
    orderBy: [asc(categories.displayOrder)],
  });

  return { ...category, children };
});

/** Every top-level category with its direct children — powers the header mega-menu. */
export async function getCategoryTree() {
  const rows = await getActiveCategoryRows();
  return rows
    .filter((c) => c.parentId === null)
    .map((category) => ({
      ...category,
      children: rows.filter((c) => c.parentId === category.id),
    }));
}
