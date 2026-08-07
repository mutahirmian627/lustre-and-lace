"use client";

import { useRecordRecentlyViewed } from "@/features/products/hooks/useRecentlyViewed";

export function RecordView({ slug }: { slug: string }) {
  useRecordRecentlyViewed(slug);
  return null;
}
