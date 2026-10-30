import { PRODUCT_ATTRIBUTES, type ProductAttributeKey } from "@/constants/product-attributes";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/features/products/types";

function optionsFor(key: string, variants: ProductVariant[]) {
  const present = new Set(
    variants.map((v) => v.attributes[key]).filter((v): v is string => !!v)
  );
  const canonicalOrder = PRODUCT_ATTRIBUTES[key as ProductAttributeKey];
  if (canonicalOrder) {
    return canonicalOrder.filter((value) => present.has(value));
  }
  return [...present];
}

export function VariantSelector({
  variants,
  attributeKeys,
  selected,
  isValueAvailable,
  onSelect,
}: {
  variants: ProductVariant[];
  attributeKeys: string[];
  selected: Record<string, string>;
  isValueAvailable: (key: string, value: string) => boolean;
  onSelect: (key: string, value: string) => void;
}) {
  if (attributeKeys.length === 0) return null;

  return (
    <div className="space-y-4">
      {attributeKeys.map((key) => (
        <div key={key} className="space-y-2">
          <span className="text-sm text-muted-foreground">
            <span className="font-medium capitalize text-foreground">{key}</span>
            {selected[key] ? `: ${selected[key]}` : ""}
          </span>
          <div className="flex flex-wrap gap-2">
            {optionsFor(key, variants).map((value) => {
              const isSelected = selected[key] === value;
              const isAvailable = isValueAvailable(key, value);
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSelect(key, value)}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary",
                    !isAvailable && "cursor-not-allowed opacity-40 line-through"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
