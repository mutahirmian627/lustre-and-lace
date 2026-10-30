import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { useCart } from "@/features/cart/context/CartProvider";
import { cn } from "@/lib/utils";
import type { CartLineItem as CartLineItemType } from "@/features/cart/types";

export function CartLineItem({
  item,
  compact = false,
}: {
  item: CartLineItemType;
  compact?: boolean;
}) {
  const { updateQuantity, removeItem } = useCart();
  // Compare as numbers, not strings: nested relational queries return
  // numeric columns via a json_build_object path that strips trailing
  // zeros ("6500" vs "6500.00"), so a string comparison here would give
  // false positives on every item whose price never actually changed.
  const priceChanged = Number(item.priceAtAdd) !== Number(item.currentPrice);
  const unavailable = item.stockQuantity === 0;

  return (
    <div className="flex gap-3">
      <Link
        href={`/products/${item.productSlug}`}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-md bg-muted",
          compact ? "size-16" : "size-20 sm:size-24"
        )}
      >
        {item.imageUrl && (
          <Image src={item.imageUrl} alt={item.productName} fill sizes={compact ? "64px" : "96px"} className="object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${item.productSlug}`} className={cn("font-medium text-foreground", compact ? "text-sm" : "font-heading text-base")}>
            {item.productName}
          </Link>
          <button
            type="button"
            aria-label="Remove from cart"
            onClick={() => removeItem(item.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {item.variantName && (
          <p className="text-xs text-muted-foreground">{item.variantName}</p>
        )}

        {unavailable ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-destructive">No longer available</span>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between gap-2">
            {!compact ? (
              <QuantityStepper
                value={item.quantity}
                max={item.stockQuantity}
                onChange={(next) => updateQuantity(item.id, next)}
              />
            ) : (
              <span className="text-xs text-muted-foreground">Qty {item.quantity}</span>
            )}
            <PriceDisplay price={String(Number(item.currentPrice) * item.quantity)} />
          </div>
        )}

        {!unavailable && item.quantity > item.stockQuantity && (
          <p className="text-xs text-destructive">Only {item.stockQuantity} left — quantity adjusted.</p>
        )}
        {priceChanged && (
          <p className="text-xs text-muted-foreground">Price updated since you added this.</p>
        )}
      </div>
    </div>
  );
}
