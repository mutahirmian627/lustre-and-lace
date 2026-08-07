import type { Metadata } from "next";
import { getProducts, getFilterFacets } from "@/actions/products.actions";
import { parseProductFilters, type RawSearchParams } from "@/features/products/types";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { FiltersSidebar } from "@/features/products/components/FiltersSidebar";
import { SortDropdown } from "@/features/products/components/SortDropdown";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";

export const metadata: Metadata = {
  title: "Shop All Jewellery",
  description: "Browse our full collection of artificial jewellery — necklaces, earrings, rings, and more.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const rawParams = await searchParams;
  const filters = parseProductFilters(rawParams);

  const [{ items, total, totalPages }, facets] = await Promise.all([
    getProducts(filters),
    getFilterFacets(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Shop All</h1>
          <p className="text-sm text-muted-foreground">{total} products</p>
        </div>
        <div className="flex items-center gap-3">
          <SortDropdown />
        </div>
      </div>

      <div className="flex gap-8">
        <FiltersSidebar facets={facets} />
        <div className="flex-1 space-y-8">
          <ProductGrid products={items} emptyAction={{ label: "Clear filters", href: "/products" }} />
          <ProductListPagination
            basePath="/products"
            currentParams={rawParams}
            page={filters.page ?? 1}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
}
