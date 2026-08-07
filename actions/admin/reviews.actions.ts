"use server";

import { headers } from "next/headers";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { reviews, products } from "@/db/schema";
import { auth } from "@/lib/auth";

const PAGE_SIZE = 20;

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

export type ReviewStatus = "pending" | "approved";

export async function getAdminReviews({
  status = "pending",
  rating,
  productId,
  page = 1,
}: {
  status?: ReviewStatus;
  rating?: number;
  productId?: string;
  page?: number;
}) {
  const conditions = [isNull(reviews.deletedAt), eq(reviews.isApproved, status === "approved")];
  if (rating) conditions.push(eq(reviews.rating, rating));
  if (productId) conditions.push(eq(reviews.productId, productId));
  const where = and(...conditions);

  const offset = (page - 1) * PAGE_SIZE;
  const [rows, [{ count }]] = await Promise.all([
    db.query.reviews.findMany({
      where,
      orderBy: [desc(reviews.createdAt)],
      limit: PAGE_SIZE,
      offset,
      with: {
        product: { columns: { id: true, name: true, slug: true } },
        user: { columns: { name: true, email: true } },
      },
    }),
    db.select({ count: sql<number>`count(*)::int` }).from(reviews).where(where),
  ]);

  return { reviews: rows, totalPages: Math.ceil(count / PAGE_SIZE), totalCount: count };
}

export async function getAllProductsForSelect() {
  return db.query.products.findMany({
    where: isNull(products.deletedAt),
    orderBy: [asc(products.name)],
    columns: { id: true, name: true },
  });
}

/**
 * products.ratingAverage/ratingCount are maintained counters (specs/02),
 * not computed on-demand at read time — this recompute is the deferred
 * piece from the storefront Reviews milestone: an unmoderated submission
 * must never move the public rating, so it only runs on approval-state
 * changes, never at submission time.
 */
async function recomputeProductRating(productId: string) {
  const [{ average, count }] = await db
    .select({
      average: sql<string>`coalesce(avg(${reviews.rating}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true), isNull(reviews.deletedAt)));

  await db
    .update(products)
    .set({ ratingAverage: Number(average).toFixed(2), ratingCount: count })
    .where(eq(products.id, productId));
}

export async function approveReview(id: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const review = await db.query.reviews.findFirst({ where: eq(reviews.id, id) });
  if (!review) return { error: "Review not found." };

  await db.update(reviews).set({ isApproved: true, updatedAt: new Date() }).where(eq(reviews.id, id));
  await recomputeProductRating(review.productId);

  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${review.productId}`);
  return { success: true as const };
}

export async function unapproveReview(id: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const review = await db.query.reviews.findFirst({ where: eq(reviews.id, id) });
  if (!review) return { error: "Review not found." };

  await db.update(reviews).set({ isApproved: false, updatedAt: new Date() }).where(eq(reviews.id, id));
  await recomputeProductRating(review.productId);

  revalidatePath("/admin/reviews");
  return { success: true as const };
}

export async function deleteReview(id: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const review = await db.query.reviews.findFirst({ where: eq(reviews.id, id) });
  if (!review) return { error: "Review not found." };

  await db.update(reviews).set({ deletedAt: new Date() }).where(eq(reviews.id, id));
  if (review.isApproved) await recomputeProductRating(review.productId);

  revalidatePath("/admin/reviews");
  return { success: true as const };
}
