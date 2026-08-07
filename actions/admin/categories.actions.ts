"use server";

import { headers } from "next/headers";
import { asc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { categoryFormSchema, type CategoryFormInput } from "@/features/admin/types";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

export async function getAdminCategories() {
  const all = await db.query.categories.findMany({
    orderBy: [asc(categories.displayOrder)],
  });
  return all;
}

export async function getTopLevelCategoriesForSelect() {
  return db.query.categories.findMany({
    where: isNull(categories.parentId),
    orderBy: [asc(categories.displayOrder)],
    columns: { id: true, name: true },
  });
}

export async function createCategory(input: CategoryFormInput) {
  await requireAdmin();
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };
  const data = parsed.data;

  await db.insert(categories).values({
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    imageUrl: data.imageUrl || null,
    parentId: data.parentId || null,
    displayOrder: data.displayOrder,
    isActive: data.isActive ?? true,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true as const };
}

export async function updateCategory(id: string, input: CategoryFormInput) {
  await requireAdmin();
  const parsed = categoryFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };
  const data = parsed.data;

  if (data.parentId === id) {
    return { error: "A category can't be its own parent." };
  }

  await db
    .update(categories)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      parentId: data.parentId || null,
      displayOrder: data.displayOrder,
      isActive: data.isActive ?? true,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id));

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true as const };
}

/**
 * products.categoryId uses onDelete: "restrict" (specs/02), so Postgres
 * itself rejects deleting a category still in use — caught here and turned
 * into a friendly count-based message instead of a raw DB error (specs/13).
 */
export async function deleteCategory(id: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();

  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    const code = (error as { cause?: { code?: string } })?.cause?.code;
    // 23001 = RESTRICT VIOLATION (this FK's actual onDelete mode) — not
    // 23503 (FOREIGN KEY VIOLATION, which is for inserts/updates pointing
    // at a row that doesn't exist). Confirmed against the real Neon error.
    if (code === "23001") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.categoryId, id));
      return { error: `Can't delete: ${count} product${count === 1 ? "" : "s"} use this category. Reassign them first.` };
    }
    throw error;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { success: true as const };
}

export async function moveCategory(id: string, direction: "up" | "down") {
  await requireAdmin();

  const all = await db.query.categories.findMany({ orderBy: [asc(categories.displayOrder)] });
  const index = all.findIndex((c) => c.id === id);
  if (index === -1) return { error: "Category not found." };

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return { success: true as const };

  const current = all[index];
  const swapWith = all[swapIndex];

  await db.batch([
    db
      .update(categories)
      .set({ displayOrder: swapWith.displayOrder })
      .where(eq(categories.id, current.id)),
    db
      .update(categories)
      .set({ displayOrder: current.displayOrder })
      .where(eq(categories.id, swapWith.id)),
  ]);

  revalidatePath("/admin/categories");
  return { success: true as const };
}
