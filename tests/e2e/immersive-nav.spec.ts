import { test, expect } from "@playwright/test";

/**
 * The immersive homepage's navigation: the bar, the full-screen menu, and what happens to focus and
 * scrolling while it is open. Runs against the hidden /immersive route.
 */
test.describe("immersive navigation", () => {
  test("the bar offers the menu, the wordmark and a way to start a project", async ({ page }) => {
    await page.goto("/immersive");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Your Website\s+Deserves\s+Better\./);

    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("link", { name: "Lustre & Lace" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Start( a project)?$/ }).first()).toHaveAttribute("href", "/get-started");
  });

  test("the menu opens, keeps focus inside, and closes with Escape back to the button", async ({ page }) => {
    await page.goto("/immersive");
    const menu = page.getByRole("button", { name: "Menu" });
    await menu.click();

    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    await expect(page.locator("main")).toHaveAttribute("inert", "");
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("#immersive-menu"))).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(menu).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert", "");
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe("hidden");
  });

  test("every menu entry goes somewhere that exists", async ({ page, request }) => {
    await page.goto("/immersive");
    await page.getByRole("button", { name: "Menu" }).click();
    const hrefs = await page.getByRole("dialog", { name: "Site menu" }).locator("nav a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href"))
    );
    expect(hrefs).toEqual(["/immersive#services", "/work", "/about", "/shop", "/get-started"]);

    for (const href of hrefs) {
      const response = await request.get((href ?? "").split("#")[0]);
      expect(response.status(), href ?? "").toBeLessThan(400);
    }
  });

  test("the Services entry scrolls to the chapter and the page turns to plum", async ({ page }) => {
    await page.goto("/immersive");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name: /Services/ }).click();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();

    await expect
      .poll(() => page.evaluate(() => Math.abs(Math.round(document.getElementById("services")!.getBoundingClientRect().top))))
      .toBeLessThan(120);
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.querySelector(".immersive-root")!).getPropertyValue("--atmosphere").trim())
      )
      .toBe("1.000");
  });

  test("the first Tab stop is the skip link", async ({ page }) => {
    await page.goto("/immersive");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("the menu still works and no 3D scene is loaded", async ({ page }) => {
      await page.goto("/immersive");
      await page.getByRole("button", { name: "Menu" }).click();
      await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
      await page.waitForTimeout(1500);
      expect(await page.locator("canvas").count()).toBe(0);
    });
  });
});
