import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { Badge } from "@/components/ui/badge";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import { getDiscountPercent } from "@/utils/discount-percent";
import type { ProductListItem } from "@/features/products/types";

/**
 * Image-first tile: a tall portrait photo with the details underneath and no
 * box around them, so the product (not the card chrome) carries the page.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductListItem;
  /** Set for above-the-fold cards so the browser fetches their image immediately instead of lazily. */
  priority?: boolean;
}) {
  const discountPercent = getDiscountPercent(product.basePrice, product.compareAtPrice);
  const href = `/products/${product.slug}`;

  return (
    <div className="group relative flex h-full flex-col">
      {/* WishlistHeartButton is a sibling, not nested in the Link below —
          a <button> inside an <a> is invalid HTML and unreliable to click. */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
        <Link href={href} className="relative block size-full" tabIndex={-1} aria-hidden="true">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </Link>
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discountPercent > 0 && (
            <Badge className="rounded-sm bg-primary text-xs uppercase tracking-wider text-primary-foreground">
              -{discountPercent}%
            </Badge>
          )}
          {product.isTrending && (
            <Badge className="rounded-sm bg-champagne text-xs uppercase tracking-wider text-plum">Trending</Badge>
          )}
        </div>
        <WishlistHeartButton productId={product.id} className="absolute right-2 top-2" />
      </div>

      <Link href={href} className="flex flex-1 flex-col gap-1.5 pt-3">
        <h3 className="line-clamp-2 font-sans text-sm font-normal leading-snug tracking-wide text-foreground transition-colors group-hover:text-primary sm:text-[0.95rem]">
          {product.name}
        </h3>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
          <PriceDisplay
            className="flex-wrap gap-x-2 gap-y-0"
            price={product.basePrice}
            compareAtPrice={product.compareAtPrice}
          />
          {product.ratingCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
              <span className="sr-only">{Number(product.ratingAverage).toFixed(1)} out of 5 stars, </span>
              <span aria-hidden="true" className="font-medium text-foreground">
                {Number(product.ratingAverage).toFixed(1)}
              </span>
              <span>({product.ratingCount})</span>
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
