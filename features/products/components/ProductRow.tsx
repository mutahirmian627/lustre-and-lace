import Link from "next/link";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ProductCard } from "@/features/products/components/ProductCard";
import type { ProductListItem } from "@/features/products/types";

/**
 * Horizontally-scrollable on mobile, grid on desktop — shared by every
 * product row across the app (homepage sections, related products, recently
 * viewed) so the pattern only lives in one place (specs/05, specs/06).
 */
export function ProductRow({
  title,
  viewAllHref,
  products,
  desktopLimit = 4,
  minItems = 1,
}: {
  title: string;
  viewAllHref?: string;
  products: ProductListItem[];
  /** Cards shown once the row becomes a grid. Phones always scroll through all of them. */
  desktopLimit?: number;
  /** A row with fewer cards than this reads as unfinished, so it's hidden instead. */
  minItems?: number;
}) {
  if (products.length < minItems) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading title={title} />
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View All
          </Link>
        )}
      </div>
      <div className="relative flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
        {products.map((product, index) => (
          <div
            key={product.id}
            className={cn(
              "w-44 shrink-0 snap-start sm:w-auto",
              // A grid row should be full: 3 across at sm/md, 4 at lg — never a 4+2 orphan row.
              index >= desktopLimit && "sm:hidden",
              index === desktopLimit - 1 && "sm:max-lg:hidden"
            )}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
