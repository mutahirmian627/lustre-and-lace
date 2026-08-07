import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star display driven by products.ratingAverage/ratingCount. */
export function RatingStars({
  rating,
  count,
  className,
}: {
  rating: number | string;
  count?: number;
  className?: string;
}) {
  const value = Number(rating);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i + 1 <= Math.round(value);
          return (
            <Star
              key={i}
              className={cn(
                "size-4",
                filled ? "fill-primary text-primary" : "fill-none text-border"
              )}
            />
          );
        })}
      </div>
      <span className="sr-only">{value.toFixed(1)} out of 5 stars</span>
      {typeof count === "number" && (
        <span className="text-sm text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
