"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { Gallery } from "@/features/products/components/Gallery";
import { VariantSelector } from "@/features/products/components/VariantSelector";
import { StockBadge } from "@/features/products/components/StockBadge";
import { useVariantSelection } from "@/features/products/hooks/useVariantSelection";
import { addToCart } from "@/actions/cart.actions";
import { WishlistHeartButton } from "@/features/wishlist/components/WishlistHeartButton";
import { cn } from "@/lib/utils";
import type { ProductImage, ProductVariant } from "@/features/products/types";

export function ProductDetailClient({
  productId,
  productName,
  productImages,
  variants,
}: {
  productId: string;
  productName: string;
  productImages: ProductImage[];
  variants: ProductVariant[];
}) {
  const searchParams = useSearchParams();
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

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setIsAdding(true);
    const result = await addToCart({
      productId,
      variantId: selectedVariant.id,
      quantity,
    });
    setIsAdding(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${productName} added to your cart.`);
    setQuantity(1);
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Gallery images={galleryImages} productName={productName} />

      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <PriceDisplay
            price={selectedVariant?.price ?? "0"}
            compareAtPrice={selectedVariant?.compareAtPrice}
            size="lg"
          />
          {selectedVariant && (
            <StockBadge stockQuantity={selectedVariant.stockQuantity} />
          )}
        </div>

        <VariantSelector
          variants={variants}
          attributeKeys={attributeKeys}
          selected={selected}
          isValueAvailable={isValueAvailable}
          onSelect={selectAttribute}
        />

        <div ref={ctaRef} className="flex items-center gap-4">
          <div className="flex items-center rounded-md border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={outOfStock || quantity <= 1}
              className="p-2 disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() =>
                setQuantity((q) =>
                  Math.min(selectedVariant?.stockQuantity ?? 1, q + 1)
                )
              }
              disabled={outOfStock || quantity >= (selectedVariant?.stockQuantity ?? 1)}
              className="p-2 disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <Button
            className="flex-1"
            disabled={outOfStock || isAdding}
            onClick={handleAddToCart}
          >
            {outOfStock ? "Out of Stock" : isAdding ? "Adding..." : "Add to Cart"}
          </Button>

          <WishlistHeartButton
            productId={productId}
            className="border border-border"
          />
        </div>
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
