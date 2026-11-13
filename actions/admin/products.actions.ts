"use server";

import { headers } from "next/headers";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, productVariants, productImages, categories } from "@/db/schema";
import { auth } from "@/lib/auth";
import { productFormSchema, type ProductFormInput } from "@/features/admin/types";
import { isAdminRole } from "@/lib/roles";
import { requireAdminUser } from "@/lib/require-admin";

const PAGE_SIZE = 20;

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !isAdminRole(session.user.role)) {
    throw new Error("Admin access required.");
  }
  return session.user;
}

export async function getAdminProducts({
  search,
  categoryId,
  status,
  page = 1,
}: {
  search?: string;
  categoryId?: string;
  status?: "active" | "inactive";
  page?: number;
}) {
  await requireAdminUser();
  const conditions = [sql`${products.deletedAt} is null`];
  if (search) {
    conditions.push(
      or(ilike(products.name, `%${search}%`), ilike(products.sku, `%${search}%`))!
    );
  }
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (status) conditions.push(eq(products.isActive, status === "active"));

  const where = and(...conditions);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, [{ count }]] = await Promise.all([
    db.query.products.findMany({
      where,
      orderBy: [desc(products.createdAt)],
      limit: PAGE_SIZE,
      offset,
      with: {
        category: { columns: { name: true } },
        variants: { columns: { price: true, stockQuantity: true } },
        images: { columns: { url: true, isPrimary: true }, orderBy: [desc(productImages.isPrimary)] },
      },
    }),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
  ]);

  return { products: rows, totalPages: Math.ceil(count / PAGE_SIZE), totalCount: count };
}

export async function getProductForEdit(id: string) {
  await requireAdminUser();
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: { orderBy: [asc(productVariants.createdAt)] },
      images: { orderBy: [asc(productImages.displayOrder)] },
    },
  });
}

function resolveVariantAttributes(v: ProductFormInput["variants"][number]) {
  const attributes: Record<string, string> = {};
  if (v.plating) attributes.plating = v.plating;
  if (v.color) attributes.color = v.color;
  if (v.size) attributes.size = v.size;
  return attributes;
}

/**
 * Product + variants + images all land in one db.batch() call — IDs for
 * brand-new variants are pre-generated client-side-of-the-batch (same
 * workaround placeOrder uses, since neon-http can't use .returning() from
 * one statement as input to another within the same atomic batch) so
 * variant-scoped images can reference them immediately.
 */
export async function createProduct(input: ProductFormInput) {
  await requireAdmin();

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };
  const data = parsed.data;

  if (!data.variants.some((v) => v.isDefault)) {
    return { error: "Exactly one variant must be marked as default." };
  }

  const productId = crypto.randomUUID();
  const variantIds = data.variants.map(() => crypto.randomUUID());
  const basePrice = Math.min(...data.variants.map((v) => v.price));

  const writes = [
    db.insert(products).values({
      id: productId,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      categoryId: data.categoryId,
      basePrice: basePrice.toFixed(2),
      compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice).toFixed(2) : null,
      sku: data.sku || null,
      isFeatured: !!data.isFeatured,
      isTrending: !!data.isTrending,
      isActive: data.isActive ?? true,
    }),
    db.insert(productVariants).values(
      data.variants.map((v, i) => ({
        id: variantIds[i],
        productId,
        name: v.name,
        sku: v.sku || null,
        price: v.price.toFixed(2),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice).toFixed(2) : null,
        stockQuantity: v.stockQuantity,
        attributes: resolveVariantAttributes(v),
        isDefault: !!v.isDefault,
      }))
    ),
    ...(data.images.length > 0
      ? [
          db.insert(productImages).values(
            data.images.map((img, i) => ({
              productId,
              variantId: img.variantKey ? variantIds[Number(img.variantKey)] : null,
              url: img.url,
              altText: img.altText || null,
              displayOrder: i,
              isPrimary: !!img.isPrimary,
            }))
          ),
        ]
      : []),
  ] as const;

  await db.batch(writes as unknown as Parameters<typeof db.batch>[0]);

  revalidatePath("/admin/products");
  return { success: true as const, productId };
}

export async function updateProduct(id: string, input: ProductFormInput) {
  await requireAdmin();

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };
  const data = parsed.data;

  if (!data.variants.some((v) => v.isDefault)) {
    return { error: "Exactly one variant must be marked as default." };
  }

  const existing = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { variants: { columns: { id: true } }, images: { columns: { id: true } } },
  });
  if (!existing) return { error: "Product not found." };

  // New variants (no id yet) get a pre-generated one, mirroring createProduct
  // — same reason: images scoped to a brand-new variant need its id before
  // the batch runs.
  const variantIds = data.variants.map((v) => v.id ?? crypto.randomUUID());
  const keptVariantIds = new Set(variantIds);
  const removedVariantIds = existing.variants
    .map((v) => v.id)
    .filter((existingId) => !keptVariantIds.has(existingId));

  const keptImageIds = new Set(data.images.map((img) => img.id).filter(Boolean));
  const removedImageIds = existing.images.map((img) => img.id).filter((imgId) => !keptImageIds.has(imgId));

  const basePrice = Math.min(...data.variants.map((v) => v.price));

  const writes = [
    db
      .update(products)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        categoryId: data.categoryId,
        basePrice: basePrice.toFixed(2),
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice).toFixed(2) : null,
        sku: data.sku || null,
        isFeatured: !!data.isFeatured,
        isTrending: !!data.isTrending,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id)),
    ...(removedVariantIds.length > 0
      ? [db.delete(productVariants).where(inArray(productVariants.id, removedVariantIds))]
      : []),
    ...(removedImageIds.length > 0
      ? [db.delete(productImages).where(inArray(productImages.id, removedImageIds))]
      : []),
    ...data.variants.map((v, i) => {
      const variantValues = {
        name: v.name,
        sku: v.sku || null,
        price: v.price.toFixed(2),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice).toFixed(2) : null,
        stockQuantity: v.stockQuantity,
        attributes: resolveVariantAttributes(v),
        isDefault: !!v.isDefault,
      };
      return v.id
        ? db.update(productVariants).set(variantValues).where(eq(productVariants.id, v.id))
        : db.insert(productVariants).values({ id: variantIds[i], productId: id, ...variantValues });
    }),
    ...data.images.map((img, i) => {
      const imageValues = {
        url: img.url,
        altText: img.altText || null,
        variantId: img.variantKey ? variantIds[Number(img.variantKey)] : null,
        displayOrder: i,
        isPrimary: !!img.isPrimary,
      };
      return img.id
        ? db.update(productImages).set(imageValues).where(eq(productImages.id, img.id))
        : db.insert(productImages).values({ productId: id, ...imageValues });
    }),
  ] as const;

  await db.batch(writes as unknown as Parameters<typeof db.batch>[0]);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath(`/shop/products`);
  return { success: true as const };
}

/** Always soft delete — never a hard delete from this UI (specs/13). */
export async function softDeleteProduct(
  id: string
): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  await db
    .update(products)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(products.id, id));
  revalidatePath("/admin/products");
  return { success: true as const };
}

export async function duplicateProduct(id: string) {
  await requireAdmin();

  const original = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { variants: true, images: true },
  });
  if (!original) return { error: "Product not found." };

  const newProductId = crypto.randomUUID();
  const variantIdMap = new Map(original.variants.map((v) => [v.id, crypto.randomUUID()]));

  const writes = [
    db.insert(products).values({
      id: newProductId,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      description: original.description,
      categoryId: original.categoryId,
      basePrice: original.basePrice,
      compareAtPrice: original.compareAtPrice,
      isFeatured: false,
      isTrending: false,
      isActive: false,
    }),
    ...(original.variants.length > 0
      ? [
          db.insert(productVariants).values(
            original.variants.map((v) => ({
              id: variantIdMap.get(v.id),
              productId: newProductId,
              name: v.name,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              stockQuantity: v.stockQuantity,
              attributes: v.attributes,
              isDefault: v.isDefault,
            }))
          ),
        ]
      : []),
    ...(original.images.length > 0
      ? [
          db.insert(productImages).values(
            original.images.map((img) => ({
              productId: newProductId,
              variantId: img.variantId ? variantIdMap.get(img.variantId) : null,
              url: img.url,
              altText: img.altText,
              displayOrder: img.displayOrder,
              isPrimary: img.isPrimary,
            }))
          ),
        ]
      : []),
  ] as const;

  await db.batch(writes as unknown as Parameters<typeof db.batch>[0]);

  revalidatePath("/admin/products");
  return { success: true as const, productId: newProductId };
}

export async function bulkSetActive(
  ids: string[],
  isActive: boolean
): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  await db.update(products).set({ isActive }).where(inArray(products.id, ids));
  revalidatePath("/admin/products");
  return { success: true as const };
}

export async function bulkSetFlag(
  ids: string[],
  flag: "isFeatured" | "isTrending",
  value: boolean
): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  await db
    .update(products)
    .set({ [flag]: value })
    .where(inArray(products.id, ids));
  revalidatePath("/admin/products");
  return { success: true as const };
}

export async function toggleProductFlag(
  id: string,
  flag: "isFeatured" | "isTrending",
  value: boolean
): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  await db
    .update(products)
    .set({ [flag]: value })
    .where(eq(products.id, id));
  revalidatePath("/admin/products");
  return { success: true as const };
}

export async function getAllCategoriesForSelect() {
  await requireAdminUser();
  return db.query.categories.findMany({
    where: eq(categories.isActive, true),
    orderBy: [asc(categories.displayOrder)],
    columns: { id: true, name: true, parentId: true },
  });
}

