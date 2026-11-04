/**
 * Renders the gem's fallback picture: public/immersive/gem-poster.png.
 *
 * It opens the running site at /immersive?poster=1, a mode in which the page strips itself down to just
 * the gem (fixed pose, transparent background), waits for the live 3D scene to draw, and screenshots
 * the gem's box. Phones and browsers that never load the 3D scene show this picture instead, so it must
 * be regenerated whenever the gem's look changes:
 *
 *   npm run dev            (in one terminal)
 *   npm run poster:immersive
 *
 * Needs a browser Playwright can drive: the bundled Chromium if installed, otherwise Microsoft Edge.
 * Set BASE_URL to render from a deployed preview instead of localhost.
 */
import { chromium } from "@playwright/test";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const output = path.join(process.cwd(), "public", "immersive", "gem-poster.png");

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: "msedge" });
  }
}

await mkdir(path.dirname(output), { recursive: true });

const browser = await launch();
try {
  const context = await browser.newContext({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/immersive?poster=1`, { waitUntil: "load", timeout: 120_000 });
  await page.waitForSelector('html[data-gem-ready="1"]', { timeout: 120_000 });
  await page.waitForTimeout(600);
  await page.locator("[data-gem-anchor]").screenshot({ path: output, omitBackground: true });
} finally {
  await browser.close();
}

const { size } = await stat(output);
console.log(`Wrote ${path.relative(process.cwd(), output)} (${(size / 1024).toFixed(0)} KB)`);
