import { getHomepageReviews } from "@/actions/home.actions";
import { RatingStars } from "@/components/shared/RatingStars";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeInSection } from "@/components/shared/FadeInSection";

export async function ReviewsCarousel() {
  const reviews = await getHomepageReviews();
  if (reviews.length === 0) return null;

  return (
    <FadeInSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading title="What Our Customers Say" align="center" className="mb-10" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg bg-accent p-5">
            <RatingStars rating={review.rating} />
            {review.comment && (
              <p className="mt-3 line-clamp-4 text-sm text-foreground">
                &ldquo;{review.comment}&rdquo;
              </p>
            )}
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {review.user.name.split(" ")[0]}
            </p>
          </div>
        ))}
      </div>
    </FadeInSection>
  );
}
