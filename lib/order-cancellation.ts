import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, productVariants, products, coupons } from "@/db/schema";
import { computeCancellationEffects, type CancellationEffects } from "@/lib/cancellation-effects";

export { computeCancellationEffects, type CancellationEffects };

interface CancellableOrder {
  id: string;
  paymentStatus: string;
  couponId: string | null;
  items: { productId: string | null; variantId: string | null; quantity: number }[];
}

/**
 * Shared by customer self-cancellation and the auto-cancel cron job
 * (specs/11). All in one db.batch() so the reversal is atomic, mirroring
 * the same neon-http workaround placeOrder uses (specs/10).
 */
export async function applyCancellationSideEffects(order: CancellableOrder) {
  const effects = computeCancellationEffects(order);

  const writes = [
    db
      .update(orders)
      .set({ status: "cancelled", paymentStatus: effects.newPaymentStatus, updatedAt: new Date() })
      .where(eq(orders.id, order.id)),
    ...effects.stockDeltas.map(({ variantId, delta }) =>
      db
        .update(productVariants)
        .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${delta}` })
        .where(eq(productVariants.id, variantId))
    ),
    ...effects.salesCountDeltas.map(({ productId, delta }) =>
      db
        .update(products)
        .set({ salesCount: sql`${products.salesCount} + ${delta}` })
        .where(eq(products.id, productId))
    ),
    ...(order.couponId && effects.couponUsageDelta !== 0
      ? [
          db
            .update(coupons)
            .set({ usageCount: sql`${coupons.usageCount} + ${effects.couponUsageDelta}` })
            .where(eq(coupons.id, order.couponId)),
        ]
      : []),
  ] as const;

  await db.batch(writes as unknown as Parameters<typeof db.batch>[0]);
}
