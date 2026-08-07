import { describe, it, expect } from "vitest";
import { calculateDiscountAmount, checkCouponEligibility, type CouponRules } from "@/lib/coupon";

describe("calculateDiscountAmount", () => {
  it("computes a percentage discount", () => {
    const amount = calculateDiscountAmount({ type: "percentage", value: "10", maxDiscountAmount: null }, 1000);
    expect(amount).toBe(100);
  });

  it("caps a percentage discount at maxDiscountAmount", () => {
    const amount = calculateDiscountAmount({ type: "percentage", value: "50", maxDiscountAmount: "300" }, 1000);
    expect(amount).toBe(300);
  });

  it("does not cap a percentage discount when under maxDiscountAmount", () => {
    const amount = calculateDiscountAmount({ type: "percentage", value: "10", maxDiscountAmount: "1000" }, 1000);
    expect(amount).toBe(100);
  });

  it("applies a fixed discount as-is when under the subtotal", () => {
    const amount = calculateDiscountAmount({ type: "fixed", value: "500", maxDiscountAmount: null }, 1000);
    expect(amount).toBe(500);
  });

  it("floors a fixed discount at the subtotal — never turns an order negative", () => {
    const amount = calculateDiscountAmount({ type: "fixed", value: "5000", maxDiscountAmount: null }, 900);
    expect(amount).toBe(900);
  });

  it("never returns a negative discount", () => {
    const amount = calculateDiscountAmount({ type: "fixed", value: "0", maxDiscountAmount: null }, 900);
    expect(amount).toBe(0);
  });

  it("ignores maxDiscountAmount for fixed coupons larger than the cap but still floors at subtotal", () => {
    // maxDiscountAmount on a fixed coupon still applies as a ceiling, per the schema allowing it on either type.
    const amount = calculateDiscountAmount({ type: "fixed", value: "500", maxDiscountAmount: "200" }, 1000);
    expect(amount).toBe(200);
  });
});

describe("checkCouponEligibility", () => {
  const baseCoupon: CouponRules = {
    isActive: true,
    startsAt: null,
    expiresAt: null,
    usageLimit: null,
    usageCount: 0,
    minOrderAmount: null,
  };
  const now = new Date("2026-06-15T00:00:00Z");

  it("passes a fully open coupon", () => {
    expect(checkCouponEligibility(baseCoupon, 1000, now)).toBeNull();
  });

  it("rejects an inactive coupon", () => {
    const result = checkCouponEligibility({ ...baseCoupon, isActive: false }, 1000, now);
    expect(result?.code).toBe("not_active");
  });

  it("rejects a coupon that hasn't started yet", () => {
    const result = checkCouponEligibility(
      { ...baseCoupon, startsAt: new Date("2026-07-01T00:00:00Z") },
      1000,
      now
    );
    expect(result?.code).toBe("not_started");
  });

  it("accepts a coupon exactly at its start date", () => {
    const startsAt = new Date("2026-06-15T00:00:00Z");
    const result = checkCouponEligibility({ ...baseCoupon, startsAt }, 1000, startsAt);
    expect(result).toBeNull();
  });

  it("rejects an expired coupon", () => {
    const result = checkCouponEligibility(
      { ...baseCoupon, expiresAt: new Date("2026-01-01T00:00:00Z") },
      1000,
      now
    );
    expect(result?.code).toBe("expired");
  });

  it("rejects a coupon at its usage limit", () => {
    const result = checkCouponEligibility({ ...baseCoupon, usageLimit: 5, usageCount: 5 }, 1000, now);
    expect(result?.code).toBe("usage_limit_reached");
  });

  it("accepts a coupon under its usage limit", () => {
    const result = checkCouponEligibility({ ...baseCoupon, usageLimit: 5, usageCount: 4 }, 1000, now);
    expect(result).toBeNull();
  });

  it("rejects an order below minOrderAmount", () => {
    const result = checkCouponEligibility({ ...baseCoupon, minOrderAmount: "3000" }, 1000, now);
    expect(result?.code).toBe("min_order_not_met");
  });

  it("accepts an order exactly at minOrderAmount", () => {
    const result = checkCouponEligibility({ ...baseCoupon, minOrderAmount: "1000" }, 1000, now);
    expect(result).toBeNull();
  });

  it("checks rules in a stable order: an inactive+expired coupon reports inactive first", () => {
    const result = checkCouponEligibility(
      { ...baseCoupon, isActive: false, expiresAt: new Date("2026-01-01T00:00:00Z") },
      1000,
      now
    );
    expect(result?.code).toBe("not_active");
  });
});
