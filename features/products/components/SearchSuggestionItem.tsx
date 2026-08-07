import Image from "next/image";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import type { ProductListItem } from "@/features/products/types";

export function SearchSuggestionItem({ product }: { product: ProductListItem }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.imageUrl && (
          <Image src={product.imageUrl} alt={product.name} fill sizes="40px" className="object-cover" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
      </div>
      <PriceDisplay price={product.basePrice} compareAtPrice={product.compareAtPrice} />
    </div>
  );
}
