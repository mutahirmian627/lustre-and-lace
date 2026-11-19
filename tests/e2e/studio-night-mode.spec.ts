import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Night mode on the studio pages: it follows the visitor's system setting until they choose, the choice is remembered, and the
 * dark pages are readable (an automated scan). The 3D homepage has no night mode and must stay as it is.
 */
const theme = (page: Page) => page.evaluate(() => document.querySelector(".studio-theme")?.getAttribute("data-theme") ?? null);

test.describe("with the system set to dark", () => {
  test.use({ colorScheme: "dark" });

  test("the studio opens dark, and the toggle switches it, and the choice is remembered", async ({ page }) => {
    await page.goto("/studio");
    expect(await theme(page)).toBe("dark");
    const toggle = page.getByRole("button", { name: "Switch to light mode" });
    await toggle.click();
    expect(await theme(page)).toBe("light");
    await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();

    await page.reload();
    expect(await theme(page)).toBe("light");
    await page.goto("/studio/services");
    expect(await theme(page)).toBe("light");
  });

  for (const path of ["/studio", "/studio/work", "/studio/services", "/studio/services/seo-growth", "/studio/get-started", "/studio/about"]) {
    test(`a scan finds nothing to fix at ${path} in the dark`, async ({ page }) => {
      await page.goto(path);
      expect(await theme(page)).toBe("dark");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target.join(" ")})`)).toEqual([]);
    });
  }

  test("the 3D homepage is not part of it", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator(".studio-theme").count()).toBe(0);
    expect(await page.getByRole("button", { name: /Switch to (dark|light) mode/ }).count()).toBe(0);
  });
});

test.describe("with the system set to light", () => {
  test.use({ colorScheme: "light" });

  test("the studio opens light, and choosing dark sticks", async ({ page }) => {
    await page.goto("/studio");
    expect(await theme(page)).toBe("light");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    expect(await theme(page)).toBe("dark");
    await page.reload();
    expect(await theme(page)).toBe("dark");
    // The page really changed colour, not just an attribute.
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe("rgb(23, 17, 26)");
  });

  test("a saved choice wins over the system setting", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("aperionie-studio-theme", "dark"));
    await page.goto("/studio/work");
    expect(await theme(page)).toBe("dark");
  });
});
