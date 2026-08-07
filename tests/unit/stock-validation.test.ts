import { describe, it, expect } from "vitest";
import { capQuantityToStock } from "@/utils/stock";

describe("capQuantityToStock", () => {
  it("returns the requested quantity when stock is sufficient", () => {
    expect(capQuantityToStock(3, 10)).toBe(3);
  });

  it("caps the quantity at available stock", () => {
    expect(capQuantityToStock(15, 10)).toBe(10);
  });

  it("returns zero when stock is exhausted", () => {
    expect(capQuantityToStock(5, 0)).toBe(0);
  });

  it("returns the exact stock amount when requested quantity equals stock", () => {
    expect(capQuantityToStock(10, 10)).toBe(10);
  });
});
