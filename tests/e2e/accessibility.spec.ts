import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES: { name: string; path: string; needsCartItem?: boolean }[] = [
  { name: "homepage", path: "/" },
  { name: "PDP", path: "/products/pearl-drop-earrings" },
  { name: "cart", path: "/cart", needsCartItem: true },
  { name: "checkout", path: "/checkout", needsCartItem: true },
];

for (const { name, path, needsCartItem } of PAGES) {
  test(`${name} has no critical or serious a11y violations`, async ({ page }) => {
    if (needsCartItem) {
      await page.goto("/products/pearl-drop-earrings");
      await page.getByRole("button", { name: "Add to Cart" }).click();
      await expect(page.getByRole("heading", { name: "Pearl Drop Earrings" })).toBeVisible({
        timeout: 45_000,
      });
    }

    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const severe = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(severe, JSON.stringify(severe, null, 2)).toEqual([]);
  });
}
