"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reorderItems } from "@/actions/orders.actions";
import { useCart } from "@/features/cart/context/CartProvider";

export function ReorderButton({ orderId }: { orderId: string }) {
  const { refreshCart, openDrawer } = useCart();
  const [isReordering, setIsReordering] = useState(false);

  async function handleClick() {
    setIsReordering(true);
    const result = await reorderItems(orderId);
    setIsReordering(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    const { added, skipped } = result;
    if (added > 0) {
      await refreshCart();
      openDrawer();
    }

    if (added === 0 && skipped === 0) return;
    if (skipped === 0) {
      toast.success(`${added} item${added === 1 ? "" : "s"} added to your cart.`);
    } else if (added === 0) {
      toast.error(`${skipped} item${skipped === 1 ? "" : "s"} unavailable and skipped.`);
    } else {
      toast.success(
        `${added} item${added === 1 ? "" : "s"} added, ${skipped} unavailable and skipped.`
      );
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isReordering}>
      {isReordering ? "Adding..." : "Reorder"}
    </Button>
  );
}
