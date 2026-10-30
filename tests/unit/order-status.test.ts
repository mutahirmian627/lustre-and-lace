import { describe, expect, it } from "vitest";
import { describeOrderStatus, extractOrderReference, looksLikeOrderStatusQuestion } from "@/features/support/order-status";
import { allowRequest } from "@/lib/rate-limit";

describe("extractOrderReference", () => {
  it("finds a reference however it's typed", () => {
    expect(extractOrderReference("LL-2026-00013")).toBe("LL-2026-00013");
    expect(extractOrderReference("ll-2026-00013")).toBe("LL-2026-00013");
    expect(extractOrderReference("LL 2026 00013")).toBe("LL-2026-00013");
    expect(extractOrderReference("LL202600013")).toBe("LL-2026-00013");
    expect(extractOrderReference("hi, status of order LL-2026-00013 please?")).toBe("LL-2026-00013");
  });

  it("ignores things that aren't order references", () => {
    expect(extractOrderReference("where is my order")).toBeNull();
    expect(extractOrderReference("LL-26-13")).toBeNull();
    expect(extractOrderReference("XLL-2026-00013")).toBeNull();
  });
});

describe("looksLikeOrderStatusQuestion", () => {
  it("recognises status questions without a number", () => {
    expect(looksLikeOrderStatusQuestion("where is my order")).toBe(true);
    expect(looksLikeOrderStatusQuestion("I want to track my order")).toBe(true);
    expect(looksLikeOrderStatusQuestion("order status")).toBe(true);
  });

  it("doesn't hijack unrelated questions", () => {
    expect(looksLikeOrderStatusQuestion("what is your return policy")).toBe(false);
    expect(looksLikeOrderStatusQuestion("how do I place an order")).toBe(false);
  });
});

describe("describeOrderStatus", () => {
  it("asks for payment on an unconfirmed bank transfer", () => {
    const result = describeOrderStatus({ status: "pending", paymentStatus: "awaiting_confirmation", paymentMethod: "manual_transfer" });
    expect(result.headline).toBe("Waiting for your payment");
    expect(result.tone).toBe("attention");
  });

  it("treats a fresh COD order as received", () => {
    expect(describeOrderStatus({ status: "pending", paymentStatus: "cod_pending", paymentMethod: "cod" }).headline).toBe("Order received");
  });

  it("covers every fulfillment status", () => {
    const base = { paymentStatus: "paid", paymentMethod: "cod" } as const;
    expect(describeOrderStatus({ ...base, status: "processing" }).headline).toBe("Being prepared");
    expect(describeOrderStatus({ ...base, status: "shipped" }).headline).toBe("On its way");
    expect(describeOrderStatus({ ...base, status: "delivered" }).headline).toBe("Delivered");
  });

  it("mentions the refund on a refunded cancellation", () => {
    const result = describeOrderStatus({ status: "cancelled", paymentStatus: "refunded", paymentMethod: "manual_transfer" });
    expect(result.detail).toMatch(/refunded/);
    expect(result.tone).toBe("bad");
  });
});

describe("allowRequest", () => {
  it("allows up to the limit inside the window, then blocks, then recovers", () => {
    const key = `test-${Math.random()}`;
    expect(allowRequest(key, 2, 1000, 0)).toBe(true);
    expect(allowRequest(key, 2, 1000, 100)).toBe(true);
    expect(allowRequest(key, 2, 1000, 200)).toBe(false);
    expect(allowRequest(key, 2, 1000, 1500)).toBe(true);
  });

  it("tracks callers separately", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(allowRequest(a, 1, 1000, 0)).toBe(true);
    expect(allowRequest(b, 1, 1000, 0)).toBe(true);
  });
});
