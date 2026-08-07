"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SearchSuggestionItem } from "@/features/products/components/SearchSuggestionItem";
import { fetchSearchSuggestions } from "@/actions/search.actions";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { POPULAR_SEARCHES } from "@/constants/site-config";
import type { ProductListItem } from "@/features/products/types";

export function SearchOverlay() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { queries: recentSearches, recordSearch } = useRecentSearches();

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      fetchSearchSuggestions(query).then((results) => {
        setSuggestions(results);
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function goToResults(searchQuery: string) {
    if (!searchQuery.trim()) return;
    recordSearch(searchQuery);
    setOpen(false);
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  }

  function goToProduct(slug: string) {
    recordSearch(query);
    setOpen(false);
    setQuery("");
    router.push(`/products/${slug}`);
  }

  return (
    <>
      <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setOpen(true)}>
        <Search className="size-5" />
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search products"
        description="Search the Lustre & Lace catalog"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search for necklaces, earrings..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.trim() ? (
              <>
                {!loading && suggestions.length === 0 && (
                  <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>
                )}
                {suggestions.length > 0 && (
                  <CommandGroup heading="Products">
                    {suggestions.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.id}
                        onSelect={() => goToProduct(product.slug)}
                      >
                        <SearchSuggestionItem product={product} />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <CommandGroup>
                  <CommandItem value="view-all" onSelect={() => goToResults(query)}>
                    View all results for &ldquo;{query}&rdquo;
                  </CommandItem>
                </CommandGroup>
              </>
            ) : (
              <>
                {recentSearches.length > 0 && (
                  <CommandGroup heading="Recent Searches">
                    {recentSearches.map((recent) => (
                      <CommandItem
                        key={recent}
                        value={recent}
                        onSelect={() => goToResults(recent)}
                      >
                        {recent}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <CommandGroup heading="Popular Searches">
                  {POPULAR_SEARCHES.map((popular) => (
                    <CommandItem
                      key={popular}
                      value={popular}
                      onSelect={() => goToResults(popular)}
                    >
                      {popular}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
