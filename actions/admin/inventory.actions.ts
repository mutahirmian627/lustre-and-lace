"use server";

import { headers } from "next/headers";
import { and, asc, eq, gt, isNull, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { productVariants, products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { LOW_STOCK_THRESHOLD } from "@/constants/inventory";
import { isAdminRole } from "@/lib/roles";
import { requireAdminUser } from "@/lib/require-admin";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !isAdminRole(session.user.role)) {
    throw new Error("Admin access required.");
  }
}

export type InventoryFilter = "all" | "low_stock" | "out_of_stock";

export async function getInventory(filter: InventoryFilter = "all") {
  await requireAdminUser();
  // Soft-deleted products disappear from every customer-facing query
  // (specs/06) — inventory management is admin-only, but a deleted
  // product's stock isn't manageable anymore either, so exclude it here
  // too. The relational query API can't filter on a joined table's
  // column, hence the query-builder join instead of db.query.
  const stockCondition =
    filter === "out_of_stock"
      ? eq(productVariants.stockQuantity, 0)
      : filter === "low_stock"
        ? and(gt(productVariants.stockQuantity, 0), lte(productVariants.stockQuantity, LOW_STOCK_THRESHOLD))
        : undefined;

  const rows = await db
    .select({
      id: productVariants.id,
      name: productVariants.name,
      stockQuantity: productVariants.stockQuantity,
      product: { id: products.id, name: products.name, slug: products.slug },
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(stockCondition ? and(isNull(products.deletedAt), stockCondition) : isNull(products.deletedAt))
    .orderBy(asc(productVariants.stockQuantity));

  return rows;
}

export async function updateVariantStock(variantId: string, stockQuantity: number): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  if (stockQuantity < 0 || !Number.isInteger(stockQuantity)) {
    return { error: "Stock quantity must be a non-negative whole number." };
  }

  await db
    .update(productVariants)
    .set({ stockQuantity, updatedAt: new Date() })
    .where(eq(productVariants.id, variantId));

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  return { success: true as const };
}
