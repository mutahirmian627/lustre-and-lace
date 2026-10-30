import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryBySlug } from "@/actions/categories.actions";
import { getProducts, getFilterFacets } from "@/actions/products.actions";
import { parseProductFilters, type RawSearchParams } from "@/features/products/types";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { FiltersSidebar } from "@/features/products/components/FiltersSidebar";
import { SortDropdown } from "@/features/products/components/SortDropdown";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name} at Lustre & Lace.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const filters = parseProductFilters(rawParams, slug);

  // Started together: getProducts/getFilterFacets already return empty results
  // for an unknown slug, so there's no need to wait on the category lookup first.
  const [category, { items, total, totalPages }, facets] = await Promise.all([
    getCategoryBySlug(slug),
    getProducts(filters),
    getFilterFacets(slug),
  ]);
  if (!category) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description ?? undefined,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: category.name, path: `/categories/${category.slug}` },
        ]}
      />
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/">Home</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">{category.name}</h1>
          {category.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground">{total} products</p>
        </div>
        <SortDropdown />
      </div>

      <div className="flex gap-8">
        <FiltersSidebar facets={facets} />
        <div className="flex-1 space-y-8">
          <ProductGrid
            products={items}
            emptyAction={{ label: "Clear filters", href: `/categories/${slug}` }}
          />
          <ProductListPagination
            basePath={`/categories/${slug}`}
            currentParams={rawParams}
            page={filters.page ?? 1}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
}
