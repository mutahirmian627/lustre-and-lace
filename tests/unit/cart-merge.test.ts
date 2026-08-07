import { describe, it, expect } from "vitest";
import { mergeCartItems, type MergeableCartItem } from "@/lib/cart-merge";

function item(overrides: Partial<MergeableCartItem>): MergeableCartItem {
  return { variantId: "v1", productId: "p1", quantity: 1, priceAtAdd: "100.00", ...overrides };
}

describe("mergeCartItems", () => {
  it("carries over a non-overlapping guest item as-is", () => {
    const result = mergeCartItems([item({ variantId: "v1", quantity: 2 })], [], new Map([["v1", 10]]));
    expect(result).toEqual([item({ variantId: "v1", quantity: 2 })]);
  });

  it("keeps a non-overlapping user item untouched", () => {
    const result = mergeCartItems([], [item({ variantId: "v2", quantity: 3 })], new Map());
    expect(result).toEqual([item({ variantId: "v2", quantity: 3 })]);
  });

  it("sums overlapping quantities for the same variant", () => {
    const guest = [item({ variantId: "v1", quantity: 2 })];
    const user = [item({ variantId: "v1", quantity: 3 })];
    const result = mergeCartItems(guest, user, new Map([["v1", 10]]));
    expect(result).toEqual([item({ variantId: "v1", quantity: 5 })]);
  });

  it("caps the summed quantity at live stock", () => {
    const guest = [item({ variantId: "v1", quantity: 8 })];
    const user = [item({ variantId: "v1", quantity: 5 })];
    const result = mergeCartItems(guest, user, new Map([["v1", 10]]));
    expect(result).toEqual([item({ variantId: "v1", quantity: 10 })]);
  });

  it("caps at zero when a variant sold out between the guest add and the merge", () => {
    const guest = [item({ variantId: "v1", quantity: 2 })];
    const user = [item({ variantId: "v1", quantity: 1 })];
    const result = mergeCartItems(guest, user, new Map([["v1", 0]]));
    expect(result).toEqual([item({ variantId: "v1", quantity: 0 })]);
  });

  it("merges multiple variants independently", () => {
    const guest = [item({ variantId: "v1", quantity: 2 }), item({ variantId: "v3", quantity: 1 })];
    const user = [item({ variantId: "v1", quantity: 1 }), item({ variantId: "v2", quantity: 4 })];
    const stock = new Map([
      ["v1", 100],
      ["v3", 100],
    ]);
    const result = mergeCartItems(guest, user, stock);
    expect(result).toHaveLength(3);
    expect(result).toEqual(
      expect.arrayContaining([
        item({ variantId: "v1", quantity: 3 }),
        item({ variantId: "v2", quantity: 4 }),
        item({ variantId: "v3", quantity: 1 }),
      ])
    );
  });

  it("returns an empty plan for two empty carts", () => {
    expect(mergeCartItems([], [], new Map())).toEqual([]);
  });
});
