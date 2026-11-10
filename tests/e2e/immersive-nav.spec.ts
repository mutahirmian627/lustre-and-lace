import { test, expect, type Page } from "@playwright/test";

/**
 * The immersive homepage (stage 1: the opening sequence): the bar, the full-screen menu, what happens to
 * focus and scrolling while it is open, and the scroll-driven hand-over from the opening to the next thought.
 * Runs against the hidden /immersive route.
 */

/** Scrolls to a fraction (0..1) of the opening sequence and returns the page's own reading of it. */
async function scrollToProgress(page: Page, fraction: number) {
  await page.evaluate((p) => {
    const run = document.getElementById("run")!;
    window.scrollTo(0, Math.round((run.offsetHeight - window.innerHeight) * p));
  }, fraction);
  await expect
    .poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector(".immersive-root")!).getPropertyValue("--p"))))
    .toBeCloseTo(fraction, 1);
}

test.describe("immersive opening", () => {
  test("shows the headline, the supporting line and both calls to action", async ({ page }) => {
    await page.goto("/immersive");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Pretty Websites\.\s*Serious Business\./);
    await expect(page.getByText("We create distinctive digital experiences, brands, and platforms")).toBeVisible();
    await expect(page.getByRole("link", { name: /Let.s Talk/ })).toHaveAttribute("href", "/get-started");
    await expect(page.getByRole("link", { name: /Explore Our Work/ })).toHaveAttribute("href", "/work");
  });

  test("hands the text over as you scroll: the opening fades out and the next thought arrives", async ({ page }) => {
    await page.goto("/immersive");
    const opening = page.getByRole("heading", { level: 1 });
    const approach = page.getByRole("heading", { level: 2, name: "Good ideas deserve better execution." });
    await expect(opening).toBeVisible();
    await expect(approach).toBeHidden();

    await scrollToProgress(page, 0.95);
    await expect(approach).toBeVisible();
    await expect(opening).toBeHidden(); // hidden from sight, keyboard and screen readers, not just faded

    await scrollToProgress(page, 0);
    await expect(opening).toBeVisible();
    await expect(approach).toBeHidden();
  });

  test("the live 3D scene takes over from the picture when the device can run it", async ({ page }) => {
    await page.goto("/immersive");
    // Either the device is judged capable (the canvas appears and the page reports "live"), or it was sorted
    // into the picture-only tier. Both are valid outcomes; a stuck "loading" state is not.
    await expect
      .poll(() => page.evaluate(() => document.querySelector<HTMLElement>(".immersive-root")?.dataset.stage), { timeout: 60_000 })
      .not.toBe("loading");
    const stage = await page.evaluate(() => document.querySelector<HTMLElement>(".immersive-root")?.dataset.stage);
    const canvases = await page.locator("canvas").count();
    if (stage === "live") expect(canvases).toBe(1);
    else expect(canvases).toBe(0);
  });
});

test.describe("immersive navigation", () => {
  test("the bar offers the menu, the wordmark and a way to start a project", async ({ page }) => {
    await page.goto("/immersive");
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
    expect(hrefs).toEqual(["/immersive#approach", "/work", "/about", "/shop", "/get-started"]);

    for (const href of hrefs) {
      const response = await request.get((href ?? "").split("#")[0]);
      expect(response.status(), href ?? "").toBeLessThan(400);
    }
  });

  test("the Approach entry scrolls into the hall and the page turns to plum", async ({ page }) => {
    await page.goto("/immersive");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name: /Approach/ }).click();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();

    await expect(page.getByRole("heading", { level: 2, name: "Good ideas deserve better execution." })).toBeVisible();
    const progress = await page.evaluate(() => Number(getComputedStyle(document.querySelector(".immersive-root")!).getPropertyValue("--p")));
    expect(progress).toBeGreaterThan(0.6);
    // By now the page's own colours have turned to the night side.
    // (The colour is mixed in oklab, so let a canvas turn it into plain RGB for us.)
    const [r, g, b] = await page.evaluate(() => {
      const context = document.createElement("canvas").getContext("2d")!;
      context.fillStyle = getComputedStyle(document.querySelector(".immersive-root")!).backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
    });
    expect(r + g + b).toBeLessThan(200);
  });

  test("the first Tab stop is the skip link", async ({ page }) => {
    await page.goto("/immersive");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("the menu still works, no 3D scene is loaded, and the pictures stand in for it", async ({ page }) => {
      await page.goto("/immersive");
      await page.getByRole("button", { name: "Menu" }).click();
      await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
      await page.waitForTimeout(1500);
      expect(await page.locator("canvas").count()).toBe(0);
      await expect(page.locator(".immersive-root")).toHaveAttribute("data-stage", "static");
      // The opening picture is in the page, and the hall picture is fetched because this device will never get the live scene.
      await expect(page.locator(".imm-still--opening img")).toHaveCount(1);
      await expect(page.locator(".imm-still--hall img")).toHaveCount(1);
    });
  });
});
