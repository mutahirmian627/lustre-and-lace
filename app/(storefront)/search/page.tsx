import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { searchProducts, getFilterFacets } from "@/actions/products.actions";
import { parseProductFilters, type RawSearchParams } from "@/features/products/types";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { FiltersSidebar } from "@/features/products/components/FiltersSidebar";
import { SortDropdown } from "@/features/products/components/SortDropdown";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { POPULAR_SEARCHES } from "@/constants/site-config";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const rawParams = await searchParams;
  const query = (Array.isArray(rawParams.q) ? rawParams.q[0] : rawParams.q)?.trim();

  if (!query) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl text-foreground">Search</h1>
        <p className="mt-2 text-muted-foreground">
          Try one of our popular searches, or use the search icon in the header.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {POPULAR_SEARCHES.map((term) => (
            <a
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
            >
              {term}
            </a>
          ))}
        </div>
      </div>
    );
  }

  const filters = parseProductFilters(rawParams, undefined, "relevance");
  const [{ items, total, totalPages }, facets] = await Promise.all([
    searchProducts(query, filters),
    getFilterFacets(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">
            Results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-sm text-muted-foreground">{total} products</p>
        </div>
        <SortDropdown includeRelevance />
      </div>

      {items.length === 0 ? (
        <div className="space-y-8">
          <EmptyState
            icon={SearchX}
            title={`No results for "${query}"`}
            description="Try a broader term, or browse one of our categories instead."
            actionLabel="Browse All Products"
            actionHref="/products"
          />
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <a
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
              >
                {term}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          <FiltersSidebar facets={facets} />
          <div className="min-w-0 space-y-8 md:flex-1">
            <ProductGrid products={items} />
            <ProductListPagination
              basePath="/search"
              currentParams={rawParams}
              page={filters.page ?? 1}
              totalPages={totalPages}
            />
          </div>
        </div>
      )}
    </div>
  );
}
