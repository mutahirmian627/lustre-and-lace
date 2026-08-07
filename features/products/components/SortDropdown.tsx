"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RELEVANCE_SORT_OPTION, SORT_OPTIONS } from "@/features/products/types";

export function SortDropdown({ includeRelevance = false }: { includeRelevance?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? (includeRelevance ? "relevance" : "newest");
  const options = includeRelevance ? [RELEVANCE_SORT_OPTION, ...SORT_OPTIONS] : SORT_OPTIONS;

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-48" aria-label="Sort products">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
