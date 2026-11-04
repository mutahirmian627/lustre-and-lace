import { afterEach, describe, expect, it, vi } from "vitest";
import { getMenuOpen, setMenuOpen } from "@/features/immersive/lib/menu-store";

describe("menu store", () => {
  afterEach(() => setMenuOpen(false));

  it("starts closed and reports changes", () => {
    expect(getMenuOpen()).toBe(false);
    setMenuOpen(true);
    expect(getMenuOpen()).toBe(true);
    setMenuOpen(false);
    expect(getMenuOpen()).toBe(false);
  });

  it("is idempotent: setting the same value again changes nothing", () => {
    setMenuOpen(true);
    const before = getMenuOpen();
    setMenuOpen(true);
    expect(getMenuOpen()).toBe(before);
  });
});

// The store's listeners are exercised through the hook in the browser tests; here we only check the
// plain module contract so that a later refactor cannot silently change its meaning.
describe("menu store module", () => {
  it("exposes a stable API", async () => {
    const mod = await import("@/features/immersive/lib/menu-store");
    expect(Object.keys(mod).sort()).toEqual(["getMenuOpen", "setMenuOpen", "useMenuOpen"]);
    vi.resetModules();
  });
});
