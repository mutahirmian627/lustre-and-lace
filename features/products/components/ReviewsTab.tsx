import { RatingStars } from "@/components/shared/RatingStars";
import { RatingBreakdown } from "@/features/products/components/RatingBreakdown";
import { ReviewForm } from "@/features/products/components/ReviewForm";

interface ReviewWithUser {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  user: { name: string };
}

export function ReviewsTab({
  productId,
  productSlug,
  reviews,
}: {
  productId: string;
  productSlug: string;
  reviews: ReviewWithUser[];
}) {
  return (
    <div className="grid gap-8 md:grid-cols-[280px_1fr]">
      <div className="space-y-6">
        <RatingBreakdown reviews={reviews} />
        <div>
          <h4 className="mb-3 font-medium text-foreground">Write a Review</h4>
          <ReviewForm productId={productId} productSlug={productSlug} />
        </div>
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet — be the first to share your thoughts.
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {review.user.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {review.createdAt.toLocaleDateString("en-PK", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <RatingStars rating={review.rating} className="mt-1" />
              {review.title && (
                <p className="mt-2 font-medium text-foreground">{review.title}</p>
              )}
              {review.comment && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
