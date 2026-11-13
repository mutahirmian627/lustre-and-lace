"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/RatingStars";
import { approveReview, unapproveReview, deleteReview } from "@/actions/admin/reviews.actions";
import type { getAdminReviews } from "@/actions/admin/reviews.actions";

type ReviewRow = Awaited<ReturnType<typeof getAdminReviews>>["reviews"][number];

export function ReviewModerationCard({ review }: { review: ReviewRow }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function run(action: () => Promise<{ error: string } | { success: true }>, message: string) {
    setIsBusy(true);
    const result = await action();
    setIsBusy(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(message);
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">{review.user.name}</p>
          <Link href={`/shop/products/${review.product.slug}`} className="text-xs text-primary hover:underline" target="_blank">
            {review.product.name}
          </Link>
        </div>
        <span className="text-xs text-muted-foreground">
          {review.createdAt.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      <RatingStars rating={review.rating} />
      {review.title && <p className="font-medium text-foreground">{review.title}</p>}
      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
      <div className="flex gap-2 pt-2">
        {review.isApproved ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => run(() => unapproveReview(review.id), "Review unapproved.")}
          >
            Unapprove
          </Button>
        ) : (
          <Button size="sm" disabled={isBusy} onClick={() => run(() => approveReview(review.id), "Review approved.")}>
            Approve
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          disabled={isBusy}
          onClick={() => run(() => deleteReview(review.id), "Review deleted.")}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
