import { z } from "zod";
import type { PRODUCT_ATTRIBUTES } from "@/constants/product-attributes";
import type { productVariants, productImages } from "@/db/schema";

export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;

export const reviewFormSchema = z.object({
  rating: z.number().int().min(1, "Select a rating").max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(2000).optional(),
});
export type ReviewFormInput = z.infer<typeof reviewFormSchema>;

export type ProductAttributeKey = keyof typeof PRODUCT_ATTRIBUTES;

export type SortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "best_selling"
  | "top_rated";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "best_selling", label: "Best Selling" },
  { value: "top_rated", label: "Top Rated" },
];

export const PAGE_SIZE = 12;

export interface ProductFilters {
  categorySlug?: string;
  plating?: string[];
  color?: string[];
  size?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sort?: SortOption;
  page?: number;
  search?: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  ratingAverage: string;
  ratingCount: number;
  imageUrl: string | null;
  isTrending: boolean;
}

export interface FilterFacets {
  minPrice: number;
  maxPrice: number;
  plating: string[];
  color: string[];
  size: string[];
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** Shared by /products and /categories/[slug] — URL query params are the source of truth (specs/06). */
export function parseProductFilters(
  searchParams: RawSearchParams,
  categorySlug?: string
): ProductFilters {
  const sortValues = SORT_OPTIONS.map((o) => o.value);
  const rawSort = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
  const sort = sortValues.includes(rawSort as SortOption) ? (rawSort as SortOption) : "newest";

  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(1, Number(rawPage) || 1);

  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const minRating = searchParams.minRating ? Number(searchParams.minRating) : undefined;

  return {
    categorySlug,
    plating: toArray(searchParams.plating),
    color: toArray(searchParams.color),
    size: toArray(searchParams.size),
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    minRating: Number.isFinite(minRating) ? minRating : undefined,
    inStockOnly: searchParams.inStock === "1",
    sort,
    page,
  };
}
