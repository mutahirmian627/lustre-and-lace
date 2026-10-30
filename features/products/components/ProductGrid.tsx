import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/features/products/components/ProductCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ProductListItem } from "@/features/products/types";

export function ProductGrid({
  products,
  emptyAction,
}: {
  products: ProductListItem[];
  emptyAction?: { label: string; href: string };
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products match these filters"
        description="Try adjusting or clearing your filters to see more results."
        actionLabel={emptyAction?.label}
        actionHref={emptyAction?.href}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}
