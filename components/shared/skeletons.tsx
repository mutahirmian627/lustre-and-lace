import { Skeleton } from "@/components/ui/skeleton";

/** Matches ProductCard's bordered 4:5 image + name/rating/price body (specs/06). */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="aspect-[3/4] w-full rounded-md" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

/** Page chrome + a grid of card skeletons for /products, /categories/[slug], and /search. */
export function ProductListingSkeleton() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex gap-8">
        <div className="hidden w-64 shrink-0 space-y-4 md:block">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Matches the PDP's two-column gallery + details layout (specs/06). */
export function ProductDetailSkeleton() {
  return (
    <div
      className="grid gap-8 md:grid-cols-2"
      aria-live="polite"
      aria-busy="true"
    >
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}

/** Matches an order-list row: reference, date/status, and total (specs/11). */
export function OrderRowSkeleton() {
  return (
    <div
      className="flex items-center justify-between gap-4 border-b border-border py-4"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}
