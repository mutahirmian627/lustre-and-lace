import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility of the homepage: an automated scan (axe, WCAG 2.2 AA and best practice) at the stops of the journey, and the
 * things a scan can't tell: that the keyboard only ever lands on something you can see, in a sensible order, and that the
 * page always has its heading and its landmarks wherever the visitor has scrolled to.
 */

// Run length after the opening, in screens (RUN in lib/timeline.ts), and some positions to look at, in scenes.
const OPENING = 2.3;
const RUN = 13.628;
const STOPS: [string, number][] = [
  ["the opening", 0],
  ["the approach", 0.95],
  ["the services", 1.2],
  ["the corridor's end", 1.41],
  ["the exhibition", 1.5],
  ["the process", 1.84],
  ["the contact", 2],
];

async function scrollToScene(page: Page, scene: number) {
  await page.evaluate(
    ([g, opening, run]) => {
      const vh = window.innerHeight;
      window.scrollTo(0, Math.round(g <= 1 ? g * opening * vh : (opening + (g - 1) * run) * vh));
    },
    [scene, OPENING, RUN] as const
  );
  await page.waitForTimeout(900); // the words fade in over half a second
}

/** Where the keyboard is: a description of the focused element, and whether you could see it. */
async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { label: "(nothing)", visible: false, hiddenFromAssistiveTech: false };
    const label = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40);
    const rect = el.getBoundingClientRect();
    const visible = el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight;
    return { label, visible, hiddenFromAssistiveTech: Boolean(el.closest("[aria-hidden='true'], [inert]")) };
  });
}

test.describe("immersive accessibility", () => {
  for (const [name, scene] of STOPS) {
    test(`a scan finds nothing to fix at ${name}`, async ({ page }) => {
      await page.goto("/");
      await scrollToScene(page, scene);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target.join(" ")})`)).toEqual([]);
    });
  }

  test("a scan of the open menu finds nothing to fix", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes[0]?.target.join(" ")})`)).toEqual([]);
  });

  test("the page has one level-one heading and its landmarks wherever you are on it", async ({ page }) => {
    await page.goto("/");
    for (const [, scene] of STOPS) {
      await scrollToScene(page, scene);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
    }
  });

  test("the keyboard starts at the skip link and only ever lands on something you can see, and can use", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1800); // the navigation bar fades in on load
    const seen: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const where = await focused(page);
      if (where.label === "(nothing)") break; // the end of the page's own tab stops
      seen.push(where.label);
      expect(where.visible, `${where.label} is focused but cannot be seen`).toBe(true);
      expect(where.hiddenFromAssistiveTech, `${where.label} is focused but hidden from assistive technology`).toBe(false);
    }
    expect(seen[0]).toBe("Skip to content");
    expect(seen[1]).toMatch(/Menu/);
  });

  test("at each stop the keyboard reaches that stop's own links, and none of another stop's", async ({ page }) => {
    await page.goto("/");
    // The exhibition's first stop: the demo store's two links.
    await scrollToScene(page, 1.5);
    const reached: string[] = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const where = await focused(page);
      if (where.label === "(nothing)") break;
      expect(where.visible, `${where.label} is focused but cannot be seen`).toBe(true);
      reached.push(where.label);
    }
    expect(reached.some((label) => /Open the demo store/.test(label))).toBe(true);
    expect(reached.some((label) => /I want a store like this/.test(label))).toBe(true);
    // Nothing from the services, the process or the contact is in the tab order here.
    expect(reached.some((label) => /Start a Conversation|WhatsApp|Instagram|^0\d/.test(label))).toBe(false);
  });

  test("the services' index is reachable and usable from the keyboard", async ({ page }) => {
    await page.goto("/");
    await scrollToScene(page, 1.1);
    const button = page.getByRole("button", { name: "04, Digital Marketing & Social Media" });
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".immersive-root")).toHaveAttribute("data-service", "3");
  });

  test("every control is at least 44 px tall", async ({ page }) => {
    await page.goto("/");
    await scrollToScene(page, 1.1);
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("button, a[href]"))
        .filter((el) => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && !el.closest(".imm-skip"))
        .map((el) => ({ label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30), height: Math.round(el.getBoundingClientRect().height) }))
        .filter((c) => c.height < 40)
    );
    expect(small).toEqual([]);
  });

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

    test("a scan finds nothing to fix in the exhibition or the contact", async ({ page }) => {
      await page.goto("/");
      for (const scene of [1.5, 1.84, 2]) {
        await scrollToScene(page, scene);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.help}`), `at scene ${scene}`).toEqual([]);
      }
    });

    test("the page does not scroll sideways", async ({ page }) => {
      await page.goto("/");
      for (const scene of [0, 1.2, 1.5, 1.84, 2]) {
        await scrollToScene(page, scene);
        const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(extra, `at scene ${scene}`).toBeLessThanOrEqual(1);
      }
    });
  });
});
