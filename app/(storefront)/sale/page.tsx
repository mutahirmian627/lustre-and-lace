import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { getProducts, getFilterFacets } from "@/actions/products.actions";
import { parseProductFilters, type RawSearchParams } from "@/features/products/types";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { FiltersSidebar } from "@/features/products/components/FiltersSidebar";
import { SortDropdown } from "@/features/products/components/SortDropdown";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = {
  title: "Sale",
  description: "Beautiful artificial jewellery at reduced prices: necklaces, earrings, bangles and rings on sale.",
  alternates: { canonical: "/sale" },
};

export default async function SalePage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const rawParams = await searchParams;
  const filters = { ...parseProductFilters(rawParams), onSale: true };

  const [{ items, total, totalPages }, facets] = await Promise.all([getProducts(filters), getFilterFacets()]);

  return (
    <div>
      <section className="border-b border-border bg-accent">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold-dark">Special offers</p>
          <h1 className="mt-2 font-heading text-4xl text-foreground sm:text-5xl">
            The <em className="font-normal italic text-primary">Sale</em>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Pieces you will love, at friendlier prices.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {total === 0 && Object.keys(rawParams).length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Nothing on sale right now"
            description="New offers appear here as soon as they're live. In the meantime, see what just arrived."
            actionLabel="Shop New Arrivals"
            actionHref="/products?sort=newest"
          />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">{total} items on sale</p>
              <SortDropdown />
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:gap-8">
              <FiltersSidebar facets={facets} />
              <div className="min-w-0 space-y-8 md:flex-1">
                <ProductGrid products={items} emptyAction={{ label: "Clear filters", href: "/sale" }} />
                <ProductListPagination
                  basePath="/sale"
                  currentParams={rawParams}
                  page={filters.page ?? 1}
                  totalPages={totalPages}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
