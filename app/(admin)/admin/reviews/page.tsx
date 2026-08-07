import type { Metadata } from "next";
import { getAdminReviews, getAllProductsForSelect, type ReviewStatus } from "@/actions/admin/reviews.actions";
import { ReviewsFilterBar } from "@/features/admin/components/ReviewsFilterBar";
import { ReviewModerationCard } from "@/features/admin/components/ReviewModerationCard";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";

export const metadata: Metadata = { title: "Admin — Reviews" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; rating?: string; productId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status: ReviewStatus = params.status === "approved" ? "approved" : "pending";
  const rating = params.rating ? Number(params.rating) : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ reviews, totalPages }, products] = await Promise.all([
    getAdminReviews({ status, rating, productId: params.productId, page }),
    getAllProductsForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-foreground">Reviews</h2>
      <ReviewsFilterBar status={status} products={products} />

      {reviews.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No {status} reviews {params.rating || params.productId ? "match these filters" : "right now"}.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <ReviewModerationCard key={review.id} review={review} />
          ))}
        </div>
      )}

      <ProductListPagination basePath="/admin/reviews" currentParams={params} page={page} totalPages={totalPages} />
    </div>
  );
}
