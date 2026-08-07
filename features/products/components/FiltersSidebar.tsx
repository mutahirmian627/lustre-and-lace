"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/utils/format-currency";
import type { FilterFacets } from "@/features/products/types";

const RATING_OPTIONS = [4, 3, 2];

export function FiltersSidebar({ facets }: { facets: FilterFacets }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 md:block">
        <FiltersContent facets={facets} />
      </aside>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline">
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>
            }
          />
          <SheetContent side="left" className="overflow-y-auto p-6">
            <SheetHeader className="px-0">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FiltersContent facets={facets} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function FiltersContent({ facets }: { facets: FilterFacets }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | null, multi = false) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (!multi) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    } else if (value !== null) {
      const current = params.getAll(key);
      if (current.includes(value)) {
        params.delete(key);
        current.filter((v) => v !== value).forEach((v) => params.append(key, v));
      } else {
        params.append(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const selectedValues = (key: string) => searchParams.getAll(key);
  const minPrice = Number(searchParams.get("minPrice") ?? facets.minPrice);
  const maxPrice = Number(searchParams.get("maxPrice") ?? facets.maxPrice);

  function setPriceRange(value: number | readonly number[]) {
    const [min, max] = Array.isArray(value) ? value : [value, value];
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("minPrice", String(min));
    params.set("maxPrice", String(max));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const hasActiveFilters =
    ["plating", "color", "size", "minRating"].some((key) => searchParams.has(key)) ||
    searchParams.has("minPrice") ||
    searchParams.has("maxPrice") ||
    searchParams.has("inStock");

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => router.push(pathname, { scroll: false })}
        >
          Clear filters
        </Button>
      )}

      {facets.maxPrice > facets.minPrice && (
        <FilterGroup title="Price">
          <Slider
            min={facets.minPrice}
            max={facets.maxPrice}
            step={50}
            value={[minPrice, maxPrice]}
            onValueChange={setPriceRange}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(minPrice)}</span>
            <span>{formatCurrency(maxPrice)}</span>
          </div>
        </FilterGroup>
      )}

      {facets.plating.length > 0 && (
        <FilterGroup title="Plating">
          {facets.plating.map((value) => (
            <CheckboxOption
              key={value}
              label={value}
              checked={selectedValues("plating").includes(value)}
              onCheckedChange={() => updateParam("plating", value, true)}
            />
          ))}
        </FilterGroup>
      )}

      {facets.color.length > 0 && (
        <FilterGroup title="Color">
          {facets.color.map((value) => (
            <CheckboxOption
              key={value}
              label={value}
              checked={selectedValues("color").includes(value)}
              onCheckedChange={() => updateParam("color", value, true)}
            />
          ))}
        </FilterGroup>
      )}

      {facets.size.length > 0 && (
        <FilterGroup title="Size">
          {facets.size.map((value) => (
            <CheckboxOption
              key={value}
              label={value}
              checked={selectedValues("size").includes(value)}
              onCheckedChange={() => updateParam("size", value, true)}
            />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Rating">
        {RATING_OPTIONS.map((rating) => (
          <CheckboxOption
            key={rating}
            label={`${rating}★ & up`}
            checked={searchParams.get("minRating") === String(rating)}
            onCheckedChange={() =>
              updateParam(
                "minRating",
                searchParams.get("minRating") === String(rating) ? null : String(rating)
              )
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        <CheckboxOption
          label="In stock only"
          checked={searchParams.get("inStock") === "1"}
          onCheckedChange={() =>
            updateParam("inStock", searchParams.get("inStock") === "1" ? null : "1")
          }
        />
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckboxOption({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      {label}
    </label>
  );
}
