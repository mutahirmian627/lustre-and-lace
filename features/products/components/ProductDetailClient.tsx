"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RotateCcw, Truck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { QuantityStepper } from "@/components/shared/QuantityStepper";
import { RatingStars } from "@/components/shared/RatingStars";
import { Gallery } from "@/features/products/components/Gallery";
import { VariantSelector } from "@/features/products/components/VariantSelector";
import { StockBadge } from "@/features/products/components/StockBadge";
import { useVariantSelection } from "@/features/products/hooks/useVariantSelection";
import { useCart } from "@/features/cart/context/CartProvider";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import { getDiscountPercent } from "@/utils/discount-percent";
import { cn } from "@/lib/utils";
import type { ProductImage, ProductVariant } from "@/features/products/types";

const REASSURANCES = [
  { icon: Truck, text: "Delivery in 3-5 business days across Pakistan" },
  { icon: Wallet, text: "Cash on Delivery available nationwide" },
  { icon: RotateCcw, text: "7-day returns on unworn items" },
] as const;

export function ProductDetailClient({
  productId,
  productName,
  productImages,
  variants,
  categoryName,
  categorySlug,
  ratingAverage,
  reviewCount,
  description,
}: {
  productId: string;
  productName: string;
  productImages: ProductImage[];
  variants: ProductVariant[];
  categoryName: string;
  categorySlug: string;
  ratingAverage: string;
  reviewCount: number;
  description: string | null;
}) {
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const { attributeKeys, selected, selectedVariant, isValueAvailable, selectAttribute } =
    useVariantSelection(variants, searchParams.get("variant") ?? undefined);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = ctaRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: "-56px 0px 0px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const variantImages = productImages.filter(
    (img) => img.variantId === selectedVariant?.id
  );
  const galleryImages =
    variantImages.length > 0
      ? variantImages
      : productImages.filter((img) => !img.variantId);

  const outOfStock = !selectedVariant || selectedVariant.stockQuantity === 0;
  const discountPercent = getDiscountPercent(selectedVariant?.price ?? "0", selectedVariant?.compareAtPrice);

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setIsAdding(true);
    const ok = await addItem({ productId, variantId: selectedVariant.id, quantity });
    setIsAdding(false);
    if (ok) setQuantity(1);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
      <div className="md:sticky md:top-28 md:self-start">
        <Gallery images={galleryImages} productName={productName} />
      </div>

      <div className="flex flex-col gap-6 md:py-2">
        <div className="space-y-3">
          <Link
            href={`/shop/categories/${categorySlug}`}
            className="text-xs font-medium uppercase tracking-[0.2em] text-primary hover:underline"
          >
            {categoryName}
          </Link>
          <h1 className="font-heading text-3xl leading-tight text-foreground sm:text-4xl">{productName}</h1>
          {reviewCount > 0 ? (
            <RatingStars rating={ratingAverage} count={reviewCount} />
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <PriceDisplay
            price={selectedVariant?.price ?? "0"}
            compareAtPrice={selectedVariant?.compareAtPrice}
            size="lg"
          />
          {discountPercent > 0 && (
            <Badge className="bg-primary text-primary-foreground">Save {discountPercent}%</Badge>
          )}
          {selectedVariant && (
            <StockBadge stockQuantity={selectedVariant.stockQuantity} />
          )}
        </div>

        {description && <p className="line-clamp-4 leading-relaxed text-muted-foreground">{description}</p>}

        <div className="border-t border-border" />

        <VariantSelector
          variants={variants}
          attributeKeys={attributeKeys}
          selected={selected}
          isValueAvailable={isValueAvailable}
          onSelect={selectAttribute}
        />

        <div ref={ctaRef} className="flex items-center gap-4">
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            max={selectedVariant?.stockQuantity ?? 1}
            disabled={outOfStock}
          />

          <Button
            size="lg"
            className="flex-1"
            disabled={outOfStock || isAdding}
            onClick={handleAddToCart}
          >
            {outOfStock ? "Out of Stock" : isAdding ? "Adding..." : "Add to Cart"}
          </Button>

          <WishlistHeartButton
            productId={productId}
            className="size-10 border border-border"
          />
        </div>

        <ul className="space-y-3 rounded-lg bg-accent p-4">
          {REASSURANCES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-foreground">
              <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Sticky mobile Add to Cart bar — appears once the main CTA scrolls out of view (specs/06) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-background p-3 shadow-[0_-4px_12px_rgb(0_0_0/0.06)] transition-transform md:hidden",
          showStickyBar ? "translate-y-0" : "translate-y-full"
        )}
      >
        <PriceDisplay
          price={selectedVariant?.price ?? "0"}
          compareAtPrice={selectedVariant?.compareAtPrice}
        />
        <Button
          className="flex-1"
          disabled={outOfStock || isAdding}
          onClick={handleAddToCart}
        >
          {outOfStock ? "Out of Stock" : isAdding ? "Adding..." : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
