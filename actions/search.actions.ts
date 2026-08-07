"use server";

import { getSearchSuggestions } from "@/actions/products.actions";

/** Server Action boundary for the client-side search overlay (specs/07). */
export async function fetchSearchSuggestions(query: string) {
  return getSearchSuggestions(query);
}
