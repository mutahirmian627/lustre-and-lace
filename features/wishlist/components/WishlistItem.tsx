"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HoverLift } from "@/components/shared/HoverLift";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { Button } from "@/components/ui/button";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import { StockBadge } from "@/features/products/components/StockBadge";
import { useCart } from "@/features/cart/context/CartProvider";
import type { ProductVariant, ProductImage } from "@/features/products/types";

interface WishlistItemProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  variants: ProductVariant[];
  images: ProductImage[];
}

export function WishlistItem({ product }: { product: WishlistItemProduct }) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0];
  const outOfStock = !defaultVariant || defaultVariant.stockQuantity === 0;

  async function handleAddToCart() {
    if (!defaultVariant) return;
    setIsAdding(true);
    await addItem({ productId: product.id, variantId: defaultVariant.id, quantity: 1 });
    setIsAdding(false);
  }

  return (
    <HoverLift>
      <div className="group">
        {/* WishlistHeartButton is a sibling, not nested in the Link below —
            a <button> inside an <a> is invalid HTML and unreliable to click. */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Link href={`/products/${product.slug}`} className="block size-full">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
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
          <WishlistHeartButton productId={product.id} className="absolute right-2 top-2" />
        </div>
        <Link href={`/products/${product.slug}`} className="mt-3 block space-y-1">
          <h3 className="line-clamp-1 font-medium text-foreground">{product.name}</h3>
          <PriceDisplay price={product.basePrice} compareAtPrice={product.compareAtPrice} />
        </Link>

        <div className="mt-3 flex items-center justify-between gap-2">
          {defaultVariant && <StockBadge stockQuantity={defaultVariant.stockQuantity} />}
          <Button size="sm" disabled={outOfStock || isAdding} onClick={handleAddToCart}>
            {outOfStock ? "Out of Stock" : isAdding ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </div>
    </HoverLift>
  );
}
