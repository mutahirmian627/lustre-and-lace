import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * The studio's chat helper: quick answers about services and packages, on the studio pages and on the 3D homepage.
 */
const OPEN = { name: "Open chat: ask about our services" };

async function openChat(page: Page) {
  await page.getByRole("button", OPEN).click();
  const panel = page.getByRole("dialog", { name: "Chat with Aperionie" });
  await expect(panel).toBeVisible();
  return panel;
}

test("on the studio pages: a suggested question, a typed one, and one it can't answer", async ({ page }) => {
  await page.goto("/studio");
  const panel = await openChat(page);
  const log = panel.getByRole("log", { name: "Chat messages" });

  await panel.getByRole("button", { name: "How much does it cost?" }).click();
  await expect(log).toContainText("we'll send a clear quote before any work starts");
  // The question that was asked is no longer offered.
  await expect(panel.getByRole("button", { name: "How much does it cost?" })).toHaveCount(0);

  await panel.getByLabel("Ask about our services", { exact: true }).fill("do you do logos?");
  await panel.getByRole("button", { name: "Send question" }).click();
  await expect(log).toContainText("Branding & Visual Identity");

  await panel.getByLabel("Ask about our services", { exact: true }).fill("what is the capital of france");
  await panel.getByRole("button", { name: "Send question" }).click();
  await expect(log).toContainText("I couldn't find an answer to that");

  // The hand-off is always there.
  await expect(panel.getByRole("link", { name: "Start a project" }).last()).toHaveAttribute("href", "/studio/get-started");
});

test("a link in an answer opens the page and closes the chat", async ({ page }) => {
  await page.goto("/studio");
  const panel = await openChat(page);
  await panel.getByRole("button", { name: "What services do you offer?" }).click();
  await panel.getByRole("link", { name: "See all services" }).click();
  await expect(page).toHaveURL(/\/studio\/services$/);
  await expect(page.getByRole("dialog", { name: "Chat with Aperionie" })).toHaveCount(0);
});

test("Escape closes the chat and the keyboard goes back to its button", async ({ page }) => {
  await page.goto("/studio/work");
  await openChat(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Chat with Aperionie" })).toHaveCount(0);
  await expect(page.getByRole("button", OPEN)).toBeFocused();
});

test("on the 3D homepage it opens too, with the studio's real contacts", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1800); // the opening fades in
  const panel = await openChat(page);
  await expect(panel.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\/923236022290/);
  await expect(panel.getByRole("link", { name: /Instagram/ })).toHaveAttribute("href", "https://instagram.com/aperionie");
  await panel.getByRole("button", { name: "Can I see your work?" }).click();
  await expect(panel.getByRole("log")).toContainText("Aperionie Foods");
});

test("on the 3D homepage the chat button is out of reach while the full-screen menu is open", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  const inert = await page.getByRole("button", OPEN).evaluate((el) => !!el.closest("[inert]"));
  expect(inert).toBe(true);
});

test("a scan of the open chat finds nothing to fix, in light and in dark", async ({ page }) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/studio");
    const panel = await openChat(page);
    await panel.getByRole("button", { name: "What packages do you offer?" }).click();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
    expect(results.violations.map((v) => `${scheme}: ${v.id}: ${v.help} (${v.nodes[0]?.target.join(" ")})`)).toEqual([]);
  }
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test("the chat button sits above the pinned 'Start your project' bar, not on it", async ({ page }) => {
    await page.goto("/studio");
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(600); // the bar slides in
    const button = await page.getByRole("button", OPEN).boundingBox();
    const bar = await page.getByRole("link", { name: "Start your project" }).last().boundingBox();
    expect(button && bar).toBeTruthy();
    expect(button!.y + button!.height).toBeLessThanOrEqual(bar!.y);
  });

  test("the open chat fills the screen and can be closed", async ({ page }) => {
    await page.goto("/studio");
    const panel = await openChat(page);
    const box = await panel.boundingBox();
    expect(box!.width).toBeGreaterThan(340);
    await panel.getByRole("button", { name: "Close chat" }).click();
    await expect(page.getByRole("dialog", { name: "Chat with Aperionie" })).toHaveCount(0);
  });
});
