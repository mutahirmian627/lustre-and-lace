/**
 * Pure coupon logic shared by cart's ephemeral validateCoupon (specs/09)
 * and checkout's server-side re-validation (specs/10) — previously
 * duplicated inline in both actions/cart.actions.ts and
 * actions/checkout.actions.ts. Takes plain values, no DB access, so it's
 * unit-testable in isolation (specs/16).
 */
export interface CouponRules {
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  minOrderAmount: string | null;
}

export interface CouponEligibilityError {
  code: "not_active" | "not_started" | "expired" | "usage_limit_reached" | "min_order_not_met";
  // Subject-less fragment (e.g. "has expired") — callers prepend their own
  // subject ("This code" in the cart, "The applied coupon" at checkout)
  // rather than this function baking in one specific phrasing.
  detail: string;
}

/** Active window, minOrderAmount, and usageLimit checks — everything except the discount math itself. */
export function checkCouponEligibility(
  coupon: CouponRules,
  subtotal: number,
  now: Date
): CouponEligibilityError | null {
  if (!coupon.isActive) {
    return { code: "not_active", detail: "is no longer active" };
  }
  if (coupon.startsAt && now < coupon.startsAt) {
    return { code: "not_started", detail: "isn't active yet" };
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { code: "expired", detail: "has expired" };
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { code: "usage_limit_reached", detail: "has reached its usage limit" };
  }
  if (coupon.minOrderAmount != null && subtotal < Number(coupon.minOrderAmount)) {
    return {
      code: "min_order_not_met",
      detail: `requires a minimum order of ${coupon.minOrderAmount}`,
    };
  }
  return null;
}

export interface CouponDiscountShape {
  type: "percentage" | "fixed";
  value: string;
  maxDiscountAmount: string | null;
}

/**
 * `percentage` is capped by maxDiscountAmount; `fixed` is floored at zero
 * and never exceeds the subtotal itself (specs/09) — a coupon can't turn
 * an order negative.
 */
export function calculateDiscountAmount(coupon: CouponDiscountShape, subtotal: number): number {
  const rawDiscount =
    coupon.type === "percentage" ? (subtotal * Number(coupon.value)) / 100 : Number(coupon.value);

  const cappedByMax =
    coupon.maxDiscountAmount != null ? Math.min(rawDiscount, Number(coupon.maxDiscountAmount)) : rawDiscount;

  return Math.max(0, Math.min(cappedByMax, subtotal));
}
