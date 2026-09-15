import Image from "next/image";
import Link from "next/link";
import { HoverLift } from "@/components/shared/HoverLift";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { RatingStars } from "@/components/shared/RatingStars";
import { Badge } from "@/components/ui/badge";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import type { ProductListItem } from "@/features/products/types";

function getDiscountPercent(price: string, compareAtPrice: string | null) {
  if (compareAtPrice == null) return 0;
  const current = Number(price);
  const original = Number(compareAtPrice);
  if (!(original > current)) return 0;
  return Math.round((1 - current / original) * 100);
}

export function ProductCard({ product }: { product: ProductListItem }) {
  const discountPercent = getDiscountPercent(product.basePrice, product.compareAtPrice);
  const href = `/products/${product.slug}`;

  return (
    <HoverLift className="h-full">
      <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
        {/* WishlistHeartButton is a sibling, not nested in the Link below —
            a <button> inside an <a> is invalid HTML and unreliable to click. */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <Link href={href} className="relative block size-full" tabIndex={-1} aria-hidden="true">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </Link>
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {discountPercent > 0 && (
              <Badge className="bg-primary text-primary-foreground">-{discountPercent}%</Badge>
            )}
            {product.isTrending && <Badge variant="secondary">Trending</Badge>}
          </div>
          <WishlistHeartButton productId={product.id} className="absolute right-2 top-2" />
        </div>

        <Link href={href} className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight text-foreground sm:text-base sm:min-h-[2.75rem]">
            {product.name}
          </h3>
          {/* Fixed-height slot so cards without reviews still line up with rated ones. */}
          <div className="h-5">
            {product.ratingCount > 0 && (
              <RatingStars rating={product.ratingAverage} count={product.ratingCount} />
            )}
          </div>
          <PriceDisplay
            className="mt-auto flex-wrap gap-x-2 gap-y-0"
            price={product.basePrice}
            compareAtPrice={product.compareAtPrice}
          />
        </Link>
      </div>
    </HoverLift>
  );
}
