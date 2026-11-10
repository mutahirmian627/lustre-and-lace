import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";

/**
 * The immersive homepage (stage 1: the opening sequence): the bar, the full-screen menu, what happens to
 * focus and scrolling while it is open, and the scroll-driven hand-over from the opening to the next thought.
 * Runs against the hidden /immersive route.
 */

/** The share of the 3D area that changes over `ms`, with nothing scrolled and no pointer movement. */
async function changeOver(page: Page, ms: number) {
  const size = page.viewportSize()!;
  const clip = { x: Math.round(size.width * 0.42), y: 80, width: Math.round(size.width * 0.56), height: Math.min(700, size.height - 120) };
  const grab = async () => sharp(await page.screenshot({ clip })).resize(240).greyscale().raw().toBuffer();
  const first = await grab();
  await page.waitForTimeout(ms);
  const second = await grab();
  let changed = 0;
  for (let i = 0; i < first.length; i++) if (Math.abs(first[i] - second[i]) > 12) changed++;
  return changed / first.length;
}

/**
 * Scrolls to a point in the experience, in "scenes": 0..1 across the opening (gallery to hall), then 1..2 across
 * the services and the close. Waits until the page's own scroll variables agree.
 */
async function scrollToScene(page: Page, scene: number) {
  await page.evaluate((g) => {
    const vh = window.innerHeight;
    // The opening is 2.3 screens of travel and everything after it 10.228 (RUN in lib/timeline.ts).
    window.scrollTo(0, Math.round(g <= 1 ? g * 2.3 * vh : (2.3 + (g - 1) * 10.228) * vh));
  }, scene);
  const [name, expected] = scene <= 1 ? ["--p", scene] : ["--s", scene - 1];
  await expect
    .poll(() => page.evaluate((n) => Number(getComputedStyle(document.querySelector(".immersive-root")!).getPropertyValue(n)), name))
    .toBeCloseTo(expected as number, 1);
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

    await scrollToScene(page, 0.95);
    await expect(approach).toBeVisible();
    await expect(opening).toBeHidden(); // hidden from sight, keyboard and screen readers, not just faded

    await scrollToScene(page, 0);
    await expect(opening).toBeVisible();
    await expect(approach).toBeHidden();
  });

  test("the services appear one at a time as you pass down the hall, and the close offers a way to get in touch", async ({ page }) => {
    await page.goto("/immersive");
    const root = page.locator(".immersive-root");

    await scrollToScene(page, 1.3);
    await expect(root).toHaveAttribute("data-phase", "services");
    await expect(page.getByText("Seven disciplines, one studio.")).toBeVisible();
    const current = Number(await root.getAttribute("data-service"));
    expect(current).toBeGreaterThanOrEqual(1);
    // The service on show fades in over half a second, so wait for it rather than sampling mid-fade.
    await expect(page.locator(`.imm-service[data-i="${current}"]`)).toHaveCSS("opacity", "1");

    // Further down, a different service is on show.
    await scrollToScene(page, 1.7);
    const later = await page.evaluate(() => Number(document.querySelector(".immersive-root")!.getAttribute("data-service")));
    expect(later).toBeGreaterThan(current);

    // Down the corridor's last stretch and through the large doorway: no words of their own, still plum.
    await scrollToScene(page, 1.55);
    await expect(root).toHaveAttribute("data-phase", "threshold");
    expect(await page.evaluate(() => Number(getComputedStyle(document.querySelector(".immersive-root")!).getPropertyValue("--flip")))).toBeLessThan(0.5);

    // In the ivory hall: the page has turned ivory and the contact words are there.
    await scrollToScene(page, 1.98);
    await expect(root).toHaveAttribute("data-phase", "contact");
    await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector(".immersive-root")!).getPropertyValue("--flip")))).toBeGreaterThan(0.95);
    await expect(page.getByRole("heading", { level: 2, name: "Got a Business to Make Beautiful?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start a Conversation" })).toHaveAttribute("href", "/get-started");
    await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\/923236022290/);
    await expect(page.getByRole("link", { name: /Instagram/ })).toHaveAttribute("href", "https://instagram.com/lustreandlacestudio");
  });

  test("each service shows its four points and no description", async ({ page }) => {
    await page.goto("/immersive");
    await scrollToScene(page, 1.3);
    expect(await page.locator(".imm-service-summary").count()).toBe(0);
    const current = Number(await page.locator(".immersive-root").getAttribute("data-service"));
    const stage = page.locator(`.imm-service[data-i="${current}"]`);
    await expect(stage.locator(".imm-service-name")).toBeVisible();
    await expect(stage.locator(".imm-service-includes")).toContainText(" · ");
    await expect(stage.locator("p")).toHaveCount(2); // the number and the points: nothing else
  });

  test("the 01-07 index takes you to that service", async ({ page }) => {
    await page.goto("/immersive");
    await scrollToScene(page, 1.1);
    const root = page.locator(".immersive-root");
    for (const [number, name, index] of [
      ["05", "SEO & Growth", 4],
      ["02", "Ecommerce Experiences", 1],
      ["07", "AI & Business Automation", 6],
    ] as const) {
      await page.getByRole("button", { name: `${number}, ${name}` }).click();
      await expect(root).toHaveAttribute("data-service", String(index));
      await expect(root).toHaveAttribute("data-phase", "services");
      await expect(page.locator(`.imm-service[data-i="${index}"]`)).toHaveCSS("opacity", "1");
    }
  });

  test("the exhibition: four stops, the real project, real links, then the contact", async ({ page }) => {
    await page.goto("/immersive");
    const root = page.locator(".immersive-root");
    const link = page.getByRole("link", { name: "Open the demo store" });

    await scrollToScene(page, 1.66);
    await expect(root).toHaveAttribute("data-phase", "work");
    await expect(root).toHaveAttribute("data-work", "0");
    await expect(page.getByText("One finished project you can actually use.")).toBeVisible();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/shop");
    await expect(page.getByRole("link", { name: /I want a store like this/ })).toHaveAttribute("href", "/get-started?service=ecommerce");

    // Further on a different stop is on show, and the first stop's links are no longer reachable.
    await scrollToScene(page, 1.78);
    await expect(root).toHaveAttribute("data-work", /^[12]$/);
    await expect(link).toBeHidden();

    await scrollToScene(page, 1.9);
    await expect(root).toHaveAttribute("data-work", "3");
    await expect(page.locator(".imm-work-name", { hasText: "Yours." })).toBeVisible();
  });

  test("the Work entry scrolls into the exhibition", async ({ page }) => {
    await page.goto("/immersive");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name: /Work/ }).click();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
    await expect(page.locator(".immersive-root")).toHaveAttribute("data-phase", "work");
  });

  test("the work is readable by assistive technology, whatever the scroll position", async ({ page }) => {
    await page.goto("/immersive");
    await expect(page.getByRole("region", { name: "Our work" }).getByRole("heading", { level: 3 })).toHaveText("Lustre & Lace Store");
  });

  test("all seven services are readable by assistive technology, whatever the scroll position", async ({ page }) => {
    await page.goto("/immersive");
    const list = page.getByRole("region", { name: "Services" }).getByRole("heading", { level: 3 });
    await expect(list).toHaveCount(7);
    await expect(list.first()).toHaveText("Website Development");
    await expect(list.last()).toHaveText("AI & Business Automation");
  });

  test("a browser that can run 3D always gets the live scene, never the picture", async ({ page }) => {
    await page.goto("/immersive");
    const hasWebgl2 = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
    test.skip(!hasWebgl2, "this browser has no WebGL 2, so pictures are the correct outcome here");
    await expect(page.locator(".immersive-root")).toHaveAttribute("data-stage", "live", { timeout: 30_000 });
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.locator(".imm-still-note")).toHaveCount(0); // and nothing is apologising for pictures
  });

  test("it is alive on its own: with nothing scrolled or touched, the scene keeps moving at the opening and deep in the corridor", async ({ page }) => {
    await page.goto("/immersive");
    const hasWebgl2 = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
    test.skip(!hasWebgl2, "needs WebGL 2");
    await expect(page.locator(".immersive-root")).toHaveAttribute("data-stage", "live", { timeout: 30_000 });
    await page.waitForTimeout(1500);
    // The approved Stage 1 opening changed about 4% of the scene in 0.4 s; demand 1% over 1.2 s, at both ends of the journey.
    expect(await changeOver(page, 1200)).toBeGreaterThan(0.01);
    await scrollToScene(page, 1.4);
    await page.waitForTimeout(3500);
    expect(await changeOver(page, 1200)).toBeGreaterThan(0.01);
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
    expect(hrefs).toEqual(["/immersive#approach", "/immersive#services", "/immersive#work", "/about", "/shop", "/get-started"]);

    for (const href of hrefs) {
      const response = await request.get((href ?? "").split("#")[0]);
      expect(response.status(), href ?? "").toBeLessThan(400);
    }
  });

  test("the Services entry scrolls to the first bay", async ({ page }) => {
    await page.goto("/immersive");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name: /Services/ }).click();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
    await expect(page.locator(".immersive-root")).toHaveAttribute("data-phase", "services");
    await expect(page.getByText("Seven disciplines, one studio.")).toBeVisible();
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

  test.describe("on a small phone", () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

    test("the opening leaves out the line under the title, so the title has room", async ({ page }) => {
      await page.goto("/immersive");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".imm-scene--opening .imm-lead")).toBeHidden();
    });

    test("the contact words are reached within one screen's scroll of the last stop", async ({ page }) => {
      await page.goto("/immersive");
      const root = page.locator(".immersive-root");
      await scrollToScene(page, 1.9);
      await expect(root).toHaveAttribute("data-work", "3");
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await expect(root).toHaveAttribute("data-phase", "contact");
      await expect(page.getByRole("link", { name: "Start a Conversation" })).toBeVisible();
    });
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("the menu still works, no live 3D is loaded, and the pictures stand in for it, with a reason and a way back", async ({ page }) => {
      await page.goto("/immersive");
      await page.getByRole("button", { name: "Menu" }).click();
      await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
      await expect(page.locator(".immersive-root")).toHaveAttribute("data-stage", "static");
      await expect(page.locator(".immersive-root")).toHaveAttribute("data-stage-reason", "reduced-motion");
      expect(await page.locator("canvas:not(.imm-journey)").count()).toBe(0);
      await expect(page.locator(".imm-still--opening img")).toHaveCount(1);
      // It says why, and offers the live scene back.
      await expect(page.locator(".imm-still-note")).toContainText("Reduced motion is on");
      await expect(page.getByRole("button", { name: "Play 3D" })).toBeVisible();
    });

    test("the pictures still travel: scrolling plays the journey frame by frame", async ({ page }) => {
      await page.goto("/immersive");
      await expect(page.locator(".imm-journey")).toHaveCount(1);
      await page.waitForTimeout(2500); // let some frames arrive
      const before = await page.locator(".imm-journey").screenshot();
      await scrollToScene(page, 1.4);
      await page.waitForTimeout(2500);
      const after = await page.locator(".imm-journey").screenshot();
      expect(Buffer.compare(before, after)).not.toBe(0);
    });

    test("'Play 3D' starts the live scene for someone who chose reduced motion but wants it", async ({ page }) => {
      await page.goto("/immersive");
      const hasWebgl2 = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
      test.skip(!hasWebgl2, "needs WebGL 2");
      await page.getByRole("button", { name: "Play 3D" }).click();
      await expect(page.locator(".immersive-root")).toHaveAttribute("data-stage", "live", { timeout: 45_000 });
      await expect(page.locator(".imm-still-note")).toHaveCount(0);
    });
  });
});
