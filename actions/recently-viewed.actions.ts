"use server";

import { getProductsBySlugs } from "@/actions/products.actions";

/**
 * Thin Server Action wrapper: RecentlyViewed is a client component (reads
 * localStorage), so it needs an RPC-callable boundary — the rest of
 * products.actions.ts is called directly from Server Components and
 * doesn't need one.
 */
export async function fetchRecentlyViewedProducts(slugs: string[]) {
  return getProductsBySlugs(slugs);
}
