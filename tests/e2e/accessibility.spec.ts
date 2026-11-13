import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createAccountFromCheckoutGate } from "./helpers/account";

const PAGES: { name: string; path: string; needsCartItem?: boolean }[] = [
  { name: "homepage", path: "/" },
  { name: "studio page", path: "/studio" },
  { name: "services", path: "/studio/services" },
  { name: "work", path: "/studio/work" },
  { name: "start a project", path: "/studio/get-started" },
  { name: "store homepage", path: "/shop" },
  { name: "PDP", path: "/shop/products/pearl-drop-earrings" },
  { name: "cart", path: "/shop/cart", needsCartItem: true },
  { name: "checkout", path: "/shop/checkout", needsCartItem: true },
];

for (const { name, path, needsCartItem } of PAGES) {
  test(`${name} has no critical or serious a11y violations`, async ({ page }) => {
    if (needsCartItem) {
      await page.goto("/shop/products/pearl-drop-earrings");
      await page.getByRole("button", { name: "Add to Cart" }).click();
      // The mini cart drawer opening is the real signal that the
      // add-to-cart Server Action resolved.
      await expect(page.getByRole("button", { name: /Checkout/ })).toBeVisible({ timeout: 45_000 });
    }

    // /checkout is behind login, so that page is reached through the real
    // sign-up gate instead of a direct goto (which would audit /login).
    if (path === "/shop/checkout") {
      await createAccountFromCheckoutGate(page, { name: "E2E A11y User", emailPrefix: "e2e-a11y" });
    } else {
      await page.goto(path);
    }
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const severe = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(severe, JSON.stringify(severe, null, 2)).toEqual([]);
  });
}
