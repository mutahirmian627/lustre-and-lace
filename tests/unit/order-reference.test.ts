import { describe, it, expect } from "vitest";
import { formatOrderReference } from "@/utils/order-reference-format";

describe("formatOrderReference", () => {
  it("pads a small sequence value to 5 digits", () => {
    expect(formatOrderReference(2026, 1)).toBe("LL-2026-00001");
  });

  it("pads a sequence value coming back as a string from the DB driver", () => {
    expect(formatOrderReference(2026, "42")).toBe("LL-2026-00042");
  });

  it("does not truncate a sequence value already at 5 digits", () => {
    expect(formatOrderReference(2026, 99999)).toBe("LL-2026-99999");
  });

  it("does not pad a sequence value longer than 5 digits", () => {
    expect(formatOrderReference(2026, 123456)).toBe("LL-2026-123456");
  });

  it("uses whatever year is passed in as a label, not the current year", () => {
    expect(formatOrderReference(2030, 5)).toBe("LL-2030-00005");
  });
});
