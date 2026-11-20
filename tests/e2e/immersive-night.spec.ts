import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { OPENING, RUN, SCENES } from "./helpers/immersive";

/**
 * "After dark" on the homepage: the switch, what it remembers, that it leaves the visitor where they were, and that the page
 * stays readable and free of accessibility problems in it. The scene itself (the lights, the reflections) is looked at with
 * screenshots, not asserted here; what can be asserted is the contract: the switch works, is announced properly, persists,
 * and is only offered when the live scene is running (the pictures-in-motion fallback is daylight only).
 */

async function settled(page: Page) {
  await page.waitForFunction(() => {
    const stage = document.querySelector<HTMLElement>(".immersive-root")?.dataset.stage;
    return stage === "live" || stage === "still";
  }, undefined, { timeout: 45_000 });
  return (await page.locator(".immersive-root").getAttribute("data-stage")) === "live";
}

const dark = (page: Page) => page.evaluate(() => Number(getComputedStyle(document.querySelector(".immersive-root")!).getPropertyValue("--dark")));

async function scrollToScene(page: Page, scene: number) {
  await page.evaluate(
    ([g, opening, run]) => {
      const vh = window.innerHeight;
      window.scrollTo(0, Math.round(g <= 1 ? g * opening * vh : (opening + (g - 1) * run) * vh));
    },
    [scene, OPENING, RUN] as const
  );
  await page.waitForTimeout(900);
}

test.describe("after dark", () => {
  test("is offered as a switch while the live scene runs, and never as a half-working control otherwise", async ({ page }) => {
    await page.goto("/");
    const live = await settled(page);
    const toggle = page.getByRole("switch", { name: "After dark" });
    if (live) {
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-checked", "false");
    } else {
      await expect(toggle).toHaveCount(0);
    }
  });

  test("the address can ask for it, and without the live scene the page stays in daylight", async ({ page }) => {
    await page.goto("/?night=1");
    const live = await settled(page);
    if (live) {
      await expect(page.getByRole("switch", { name: "After dark" })).toHaveAttribute("aria-checked", "true");
      expect(await dark(page)).toBe(1);
    } else {
      await expect(page.locator(".immersive-root")).not.toHaveAttribute("data-night", "1");
      expect(await dark(page)).toBe(0);
    }
  });

  test("changes the page, leaves the visitor where they were, and comes back to daylight exactly", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await settled(page)), "the live scene is not running in this browser");
    await scrollToScene(page, SCENES.services);
    const before = await page.evaluate(() => window.scrollY);
    const toggle = page.getByRole("switch", { name: "After dark" });

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await expect.poll(() => dark(page), { timeout: 8000 }).toBe(1);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);

    // Switching back and forth, including turning round in the middle of a change, settles on the last choice.
    for (let i = 0; i < 5; i++) {
      await toggle.click();
      await page.waitForTimeout(i % 2 ? 250 : 900);
    }
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect.poll(() => dark(page), { timeout: 8000 }).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test("is remembered on the next visit, and the address wins over the memory", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await settled(page)), "the live scene is not running in this browser");
    await page.getByRole("switch", { name: "After dark" }).click();
    await expect.poll(() => dark(page), { timeout: 8000 }).toBe(1);

    await page.reload();
    // Before the scene has even loaded the page is already dressed for the night (no flash of daylight).
    await expect(page.locator(".immersive-root")).toHaveAttribute("data-night", "1");
    await settled(page);
    await expect(page.getByRole("switch", { name: "After dark" })).toHaveAttribute("aria-checked", "true");

    await page.goto("/?night=0");
    await settled(page);
    await expect(page.getByRole("switch", { name: "After dark" })).toHaveAttribute("aria-checked", "false");
  });

  test("can be used from the keyboard and is announced by what it is", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await settled(page)), "the live scene is not running in this browser");
    const toggle = page.getByRole("switch", { name: "After dark" });
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  for (const [name, scene] of [["the opening", 0], ["the services", SCENES.services], ["the exhibition", SCENES.work(0)], ["the contact", SCENES.contact]] as const) {
    test(`a scan finds nothing to fix after dark at ${name}`, async ({ page }) => {
      await page.goto("/?night=1");
      test.skip(!(await settled(page)), "the live scene is not running in this browser");
      await expect.poll(() => dark(page), { timeout: 8000 }).toBe(1);
      await page.waitForTimeout(1800);
      await scrollToScene(page, scene);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target.join(" ")})`)).toEqual([]);
    });
  }

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

    test("the switch is a small icon that fits beside the other bar controls", async ({ page }) => {
      await page.goto("/");
      test.skip(!(await settled(page)), "the live scene is not running in this browser");
      const boxes = await page.evaluate(() =>
        ["[data-night-toggle]", ".imm-wordmark", ".imm-pill--solid", ".imm-nav-row > :first-child"].map((selector) => {
          const r = document.querySelector(selector)!.getBoundingClientRect();
          return { selector, left: r.left, right: r.right };
        })
      );
      const sorted = [...boxes].sort((a, b) => a.left - b.left);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i].left, `${sorted[i].selector} overlaps ${sorted[i - 1].selector}`).toBeGreaterThanOrEqual(sorted[i - 1].right - 0.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    });
  });
});
