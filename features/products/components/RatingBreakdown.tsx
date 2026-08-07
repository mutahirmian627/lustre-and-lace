interface ReviewLike {
  rating: number;
}

export function RatingBreakdown({ reviews }: { reviews: ReviewLike[] }) {
  const total = reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  if (total === 0) return null;

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-sm">
          <span className="w-10 shrink-0 text-muted-foreground">{star} star</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-muted-foreground">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}
