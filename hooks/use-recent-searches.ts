"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lustre-and-lace:recent-searches";
const MAX_ITEMS = 5;

function readQueries(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Recent searches — browser storage only, per specs/07 (no search-analytics table). */
export function useRecentSearches() {
  const [queries, setQueries] = useState<string[]>([]);

  useEffect(() => {
    setQueries(readQueries());
  }, []);

  function recordSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    const next = [trimmed, ...readQueries().filter((q) => q !== trimmed)].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setQueries(next);
  }

  function clearSearches() {
    window.localStorage.removeItem(STORAGE_KEY);
    setQueries([]);
  }

  return { queries, recordSearch, clearSearches };
}
