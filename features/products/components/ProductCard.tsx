import Image from "next/image";
import Link from "next/link";
import { HoverLift } from "@/components/shared/HoverLift";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { RatingStars } from "@/components/shared/RatingStars";
import { Badge } from "@/components/ui/badge";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import type { ProductListItem } from "@/features/products/types";

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <HoverLift>
      <div className="group">
        {/* WishlistHeartButton is a sibling, not nested in the Link below —
            a <button> inside an <a> is invalid HTML and unreliable to click. */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Link href={`/products/${product.slug}`} className="relative block size-full">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </Link>
          {product.isTrending && (
            <Badge variant="secondary" className="absolute left-2 top-2">
              Trending
            </Badge>
          )}
          <WishlistHeartButton
            productId={product.id}
            className="absolute right-2 top-2"
          />
        </div>
        <Link href={`/products/${product.slug}`} className="mt-3 block space-y-1">
          <h3 className="line-clamp-1 font-medium text-foreground">
            {product.name}
          </h3>
          {product.ratingCount > 0 && (
            <RatingStars rating={product.ratingAverage} count={product.ratingCount} />
          )}
          <PriceDisplay
            price={product.basePrice}
            compareAtPrice={product.compareAtPrice}
          />
        </Link>
      </div>
    </HoverLift>
  );
}
