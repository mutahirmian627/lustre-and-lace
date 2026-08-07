"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addAllWishlistToCart } from "@/actions/wishlist.actions";

export function AddAllToCartButton() {
  const [isAdding, setIsAdding] = useState(false);

  async function handleClick() {
    setIsAdding(true);
    const { added, skipped } = await addAllWishlistToCart();
    setIsAdding(false);

    if (added === 0 && skipped === 0) return;
    if (skipped === 0) {
      toast.success(`${added} item${added === 1 ? "" : "s"} added to your cart.`);
    } else if (added === 0) {
      toast.error(`${skipped} item${skipped === 1 ? "" : "s"} out of stock and skipped.`);
    } else {
      toast.success(
        `${added} item${added === 1 ? "" : "s"} added, ${skipped} out of stock and skipped.`
      );
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isAdding}>
      {isAdding ? "Adding..." : "Add All to Cart"}
    </Button>
  );
}
