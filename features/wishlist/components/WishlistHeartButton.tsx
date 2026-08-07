"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/features/wishlist/context/WishlistProvider";
import { cn } from "@/lib/utils";

export function WishlistHeartButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { isWishlisted, toggle } = useWishlist();
  const active = isWishlisted(productId);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      onClick={() => toggle(productId)}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:text-primary",
        className
      )}
    >
      <Heart className={cn("size-4", active && "fill-primary text-primary")} />
    </button>
  );
}
