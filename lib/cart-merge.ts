import { capQuantityToStock } from "@/utils/stock";

export interface MergeableCartItem {
  variantId: string;
  productId: string;
  quantity: number;
  priceAtAdd: string;
}

/**
 * Pure guest-cart-merge planning (specs/03) — sums overlapping
 * (variantId) quantities capped at stock; non-overlapping guest items
 * carry over as-is. Takes plain arrays/a stock lookup, no DB access, so
 * it's unit-testable (specs/16); actions/cart.actions.ts's mergeGuestCart
 * executes the resulting plan against the database.
 */
export function mergeCartItems(
  guestItems: MergeableCartItem[],
  userItems: MergeableCartItem[],
  stockByVariantId: Map<string, number>
): MergeableCartItem[] {
  const merged = new Map<string, MergeableCartItem>();
  for (const item of userItems) {
    merged.set(item.variantId, { ...item });
  }

  for (const guestItem of guestItems) {
    const existing = merged.get(guestItem.variantId);
    if (existing) {
      const stock = stockByVariantId.get(guestItem.variantId) ?? 0;
      merged.set(guestItem.variantId, {
        ...existing,
        quantity: capQuantityToStock(existing.quantity + guestItem.quantity, stock),
      });
    } else {
      merged.set(guestItem.variantId, { ...guestItem });
    }
  }

  return Array.from(merged.values());
}
