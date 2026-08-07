"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lustre-and-lace:recently-viewed";
const MAX_ITEMS = 12;

function readSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Records the current product as viewed, browser-storage only (specs/06 — no DB table). */
export function useRecordRecentlyViewed(slug: string) {
  useEffect(() => {
    const existing = readSlugs().filter((s) => s !== slug);
    const next = [slug, ...existing].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [slug]);
}

/** Returns recently-viewed slugs (most-recent first), excluding one product. */
export function useRecentlyViewedSlugs(excludeSlug?: string) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(readSlugs().filter((s) => s !== excludeSlug));
  }, [excludeSlug]);

  return slugs;
}
