"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reviews, orders } from "@/db/schema";

const submitReviewSchema = z.object({
  productId: z.string().uuid(),
  productSlug: z.string(),
  orderId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});

type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

/** Gated on verified email, per the resolved specs/03 open decision. */
export async function submitReview(input: SubmitReviewInput) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { error: "You must be signed in to write a review." as const };
  }
  if (!session.user.emailVerified) {
    return { error: "Please verify your email before writing a review." as const };
  }

  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid review." as const };
  }

  // Only attach the "verified purchase" link if the order genuinely belongs
  // to this reviewer, was delivered, and actually contains this product —
  // orderId arrives via a URL param, so it can't be trusted on its own.
  let orderId: string | undefined;
  if (parsed.data.orderId) {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parsed.data.orderId),
      with: { items: { columns: { productId: true } } },
    });
    if (
      order &&
      order.userId === session.user.id &&
      order.status === "delivered" &&
      order.items.some((item) => item.productId === parsed.data.productId)
    ) {
      orderId = order.id;
    }
  }

  await db.insert(reviews).values({
    productId: parsed.data.productId,
    userId: session.user.id,
    orderId,
    rating: parsed.data.rating,
    title: parsed.data.title,
    comment: parsed.data.comment,
  });

  // products.ratingAverage/ratingCount are recomputed on admin approval
  // (specs/13), not here — reviews start unapproved, so an unmoderated
  // submission must never move the public rating.
  revalidatePath(`/shop/products/${parsed.data.productSlug}`);
  return {
    success: true as const,
    message: "Thanks! Your review will appear once it's approved.",
  };
}
