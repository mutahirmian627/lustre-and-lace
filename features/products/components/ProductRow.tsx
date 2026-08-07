import Link from "next/link";
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
}: {
  title: string;
  viewAllHref?: string;
  products: ProductListItem[];
}) {
  if (products.length === 0) return null;

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
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="w-40 shrink-0 snap-start sm:w-auto"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
