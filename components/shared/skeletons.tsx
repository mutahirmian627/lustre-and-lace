import { Skeleton } from "@/components/ui/skeleton";

/** Matches ProductCard's bordered 4:5 image + name/rating/price body (specs/06). */
export function ProductCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
      aria-hidden="true"
    >
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="flex flex-col gap-1.5 p-3 sm:p-4">
        <Skeleton className="h-10 w-full sm:h-11" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
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
