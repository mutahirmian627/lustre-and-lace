/**
 * Renders the first-paint pictures of the immersive scene into public/immersive/ (the rest of the fallback, the
 * whole journey as frames, is made by scripts/render-immersive-journey.mjs):
 *
 *   opening-landscape.webp   opening-portrait.webp   the gallery, as the page first appears
 *
 * Each is a frame of the real scene. The script opens the running site at /immersive?poster=1&p=<scroll>,
 * a mode in which the page strips itself down to just the 3D canvas, frozen at a fixed moment, waits for
 * the first frames to draw, and screenshots it. Phones with weak graphics, reduced-motion visitors and every
 * first paint show these, so regenerate them whenever the scene's look changes:
 *
 *   npm run dev            (in one terminal)
 *   npm run poster:immersive
 *
 * Needs a browser Playwright can drive: the bundled Chromium if installed, otherwise Microsoft Edge.
 * Set BASE_URL to render from a deployed preview instead of localhost.
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "public", "immersive");

// Sizes match the reference framings in features/immersive/scene/CameraRig.tsx (16:9 and 1:2).
const shots = [
  { name: "opening-landscape", width: 1600, height: 900, p: 0 },
  { name: "opening-portrait", width: 750, height: 1500, p: 0 },
];

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: "msedge" });
  }
}

await mkdir(outDir, { recursive: true });

const browser = await launch();
try {
  for (const shot of shots) {
    const context = await browser.newContext({ viewport: { width: shot.width, height: shot.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/immersive?poster=1&p=${shot.p}`, { waitUntil: "load", timeout: 120_000 });
    await page.waitForSelector('html[data-stage-ready="1"]', { timeout: 120_000 });
    await page.waitForTimeout(800);
    const png = await page.screenshot({ type: "png" });
    const file = path.join(outDir, `${shot.name}.webp`);
    await sharp(png).webp({ quality: 74, effort: 5 }).toFile(file);
    const { size } = await stat(file);
    console.log(`Wrote ${path.relative(process.cwd(), file)} (${(size / 1024).toFixed(0)} KB)`);
    await context.close();
  }
} finally {
  await browser.close();
}
