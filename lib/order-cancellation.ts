import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, productVariants, coupons } from "@/db/schema";

interface CancellableOrder {
  id: string;
  paymentStatus: string;
  couponId: string | null;
  items: { variantId: string | null; quantity: number }[];
}

/**
 * Shared by customer self-cancellation and the auto-cancel cron job
 * (specs/11) — restocks every line item, reverses coupon usage, and moves
 * paymentStatus to failed/refunded depending on whether payment had already
 * been confirmed. All in one db.batch() so the reversal is atomic, mirroring
 * the same neon-http workaround placeOrder uses (specs/10).
 */
export async function applyCancellationSideEffects(order: CancellableOrder) {
  const newPaymentStatus = order.paymentStatus === "paid" ? "refunded" : "failed";

  const writes = [
    db
      .update(orders)
      .set({ status: "cancelled", paymentStatus: newPaymentStatus, updatedAt: new Date() })
      .where(eq(orders.id, order.id)),
    ...order.items
      .filter((item) => item.variantId)
      .map((item) =>
        db
          .update(productVariants)
          .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${item.quantity}` })
          .where(eq(productVariants.id, item.variantId!))
      ),
    ...(order.couponId
      ? [db.update(coupons).set({ usageCount: sql`${coupons.usageCount} - 1` }).where(eq(coupons.id, order.couponId))]
      : []),
  ] as const;

  await db.batch(writes as unknown as Parameters<typeof db.batch>[0]);
}
