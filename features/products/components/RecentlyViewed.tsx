"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewedSlugs } from "@/features/products/hooks/useRecentlyViewed";
import { fetchRecentlyViewedProducts } from "@/actions/recently-viewed.actions";
import { ProductRow } from "@/features/products/components/ProductRow";
import type { ProductListItem } from "@/features/products/types";

export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const slugs = useRecentlyViewedSlugs(excludeSlug);
  const [products, setProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([]);
      return;
    }
    fetchRecentlyViewedProducts(slugs).then(setProducts);
  }, [slugs]);

  if (products.length === 0) return null;

  return <ProductRow title="Recently Viewed" products={products} />;
}
