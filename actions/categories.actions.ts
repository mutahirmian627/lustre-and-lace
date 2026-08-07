import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";

export async function getTopLevelCategories() {
  return db.query.categories.findMany({
    where: and(isNull(categories.parentId), eq(categories.isActive, true)),
    orderBy: [asc(categories.displayOrder)],
  });
}

export async function getCategoryBySlug(slug: string) {
  const category = await db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), eq(categories.isActive, true)),
  });
  if (!category) return null;

  const children = await db.query.categories.findMany({
    where: and(eq(categories.parentId, category.id), eq(categories.isActive, true)),
    orderBy: [asc(categories.displayOrder)],
  });

  return { ...category, children };
}

/** Every top-level category with its direct children — powers the header mega-menu. */
export async function getCategoryTree() {
  const topLevel = await getTopLevelCategories();
  const withChildren = await Promise.all(
    topLevel.map(async (category) => ({
      ...category,
      children: await db.query.categories.findMany({
        where: and(eq(categories.parentId, category.id), eq(categories.isActive, true)),
        orderBy: [asc(categories.displayOrder)],
      }),
    }))
  );
  return withChildren;
}
