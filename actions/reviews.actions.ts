"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reviews } from "@/db/schema";

const submitReviewSchema = z.object({
  productId: z.string().uuid(),
  productSlug: z.string(),
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

  await db.insert(reviews).values({
    productId: parsed.data.productId,
    userId: session.user.id,
    rating: parsed.data.rating,
    title: parsed.data.title,
    comment: parsed.data.comment,
  });

  // products.ratingAverage/ratingCount are recomputed on admin approval
  // (specs/13), not here — reviews start unapproved, so an unmoderated
  // submission must never move the public rating.
  revalidatePath(`/products/${parsed.data.productSlug}`);
  return {
    success: true as const,
    message: "Thanks! Your review will appear once it's approved.",
  };
}
