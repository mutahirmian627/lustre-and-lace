interface CancellableOrder {
  id: string;
  paymentStatus: string;
  couponId: string | null;
  items: { productId: string | null; variantId: string | null; quantity: number }[];
}

export interface CancellationEffects {
  newPaymentStatus: "refunded" | "failed";
  stockDeltas: { variantId: string; delta: number }[];
  salesCountDeltas: { productId: string; delta: number }[];
  couponUsageDelta: number;
}

/**
 * Pure decision layer for cancellation (specs/11, specs/16) — no DB import,
 * unlike order-cancellation.ts, so it's importable in unit tests without a
 * live DATABASE_URL. Covers the restock math, salesCount reversal,
 * coupon-usage reversal, and the paid->refunded vs else->failed
 * payment-status transition; order-cancellation.ts turns this into writes.
 */
export function computeCancellationEffects(order: CancellableOrder): CancellationEffects {
  return {
    newPaymentStatus: order.paymentStatus === "paid" ? "refunded" : "failed",
    stockDeltas: order.items
      .filter((item): item is typeof item & { variantId: string } => !!item.variantId)
      .map((item) => ({ variantId: item.variantId, delta: item.quantity })),
    // The sale didn't actually happen — reverse the salesCount increment
    // from placeOrder so the admin dashboard's Top Selling Products chart
    // (specs/13) doesn't keep counting a cancelled order.
    salesCountDeltas: order.items
      .filter((item): item is typeof item & { productId: string } => !!item.productId)
      .map((item) => ({ productId: item.productId, delta: -item.quantity })),
    couponUsageDelta: order.couponId ? -1 : 0,
  };
}
