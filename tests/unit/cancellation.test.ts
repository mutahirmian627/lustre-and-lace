import { describe, it, expect } from "vitest";
import { computeCancellationEffects } from "@/lib/cancellation-effects";

describe("computeCancellationEffects", () => {
  it("restocks every line item by its ordered quantity", () => {
    const effects = computeCancellationEffects({
      id: "order-1",
      paymentStatus: "cod_pending",
      couponId: null,
      items: [
        { productId: "p1", variantId: "v1", quantity: 2 },
        { productId: "p2", variantId: "v2", quantity: 1 },
      ],
    });
    expect(effects.stockDeltas).toEqual(
      expect.arrayContaining([
        { variantId: "v1", delta: 2 },
        { variantId: "v2", delta: 1 },
      ])
    );
  });

  it("reverses salesCount by the same quantities restocked", () => {
    const effects = computeCancellationEffects({
      id: "order-1",
      paymentStatus: "cod_pending",
      couponId: null,
      items: [{ productId: "p1", variantId: "v1", quantity: 3 }],
    });
    expect(effects.salesCountDeltas).toEqual([{ productId: "p1", delta: -3 }]);
  });

  it("skips items with no variant (deleted product) for stock but still reverses sales count if productId survives", () => {
    const effects = computeCancellationEffects({
      id: "order-1",
      paymentStatus: "cod_pending",
      couponId: null,
      items: [{ productId: "p1", variantId: null, quantity: 2 }],
    });
    expect(effects.stockDeltas).toEqual([]);
    expect(effects.salesCountDeltas).toEqual([{ productId: "p1", delta: -2 }]);
  });

  it("reverses coupon usage by exactly one when a coupon was applied", () => {
    const effects = computeCancellationEffects({
      id: "order-1",
      paymentStatus: "cod_pending",
      couponId: "coupon-1",
      items: [],
    });
    expect(effects.couponUsageDelta).toBe(-1);
  });

  it("has no coupon usage delta when no coupon was applied", () => {
    const effects = computeCancellationEffects({
      id: "order-1",
      paymentStatus: "cod_pending",
      couponId: null,
      items: [],
    });
    expect(effects.couponUsageDelta).toBe(0);
  });

  it("moves a paid order's payment status to refunded — money had already changed hands", () => {
    const effects = computeCancellationEffects({
      id: "order-1",
      paymentStatus: "paid",
      couponId: null,
      items: [],
    });
    expect(effects.newPaymentStatus).toBe("refunded");
  });

  it.each(["cod_pending", "awaiting_confirmation", "failed"])(
    "moves a %s order's payment status to failed — payment never completed",
    (paymentStatus) => {
      const effects = computeCancellationEffects({
        id: "order-1",
        paymentStatus,
        couponId: null,
        items: [],
      });
      expect(effects.newPaymentStatus).toBe("failed");
    }
  );
});
