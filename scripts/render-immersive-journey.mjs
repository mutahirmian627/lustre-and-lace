/**
 * Renders the fallback journey: public/immersive/journey/l-00..31.webp (landscape) and p-00..31.webp (portrait).
 *
 * These are 32 frames of the real scene, evenly spaced along the whole journey (scroll position 0 to 2, from the
 * gallery's opening to the end of the corridor). Devices that are not running the live scene play them by scroll
 * (see features/immersive/sections/StillJourney.tsx). The script opens the running site at
 * /immersive?poster=1&p=<position>, a mode in which the page strips itself down to the 3D canvas, frozen at a fixed
 * moment, and screenshots it once the first frames have drawn.
 *
 *   npm run dev            (in one terminal)
 *   npm run journey:immersive
 *
 * Regenerate whenever the scene's look or route changes. Needs a browser Playwright can drive (the bundled Chromium
 * if installed, otherwise Microsoft Edge). Set BASE_URL to render from a deployed preview instead of localhost.
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "public", "immersive", "journey");
const FRAMES = 32;
const SCENES = 2;

// Sizes match the reference framings in features/immersive/lib/frame.ts (about 16:9, and 1:2).
const allCuts = [
  { prefix: "l", width: 1280, height: 720 },
  { prefix: "p", width: 600, height: 1200 },
];
// CUTS=p renders only the portrait cut (handy to redo one after an interruption).
const cuts = allCuts.filter((cut) => !process.env.CUTS || process.env.CUTS.includes(cut.prefix));

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: "msedge" });
  }
}

await mkdir(outDir, { recursive: true });
const browser = await launch();
let total = 0;
try {
  for (const cut of cuts) {
    const context = await browser.newContext({ viewport: { width: cut.width, height: cut.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    for (let i = 0; i < FRAMES; i++) {
      const position = (SCENES * i) / (FRAMES - 1);
      // A dev server can stall for a moment (recompiling); try each frame a few times before giving up.
      for (let attempt = 1; ; attempt++) {
        try {
          await page.goto(`${baseUrl}/immersive?poster=1&p=${position.toFixed(4)}`, { waitUntil: "load", timeout: 60_000 });
          await page.waitForSelector('html[data-stage-ready="1"]', { timeout: 30_000 });
          break;
        } catch (error) {
          if (attempt >= 4) throw error;
        }
      }
      await page.waitForTimeout(500);
      const png = await page.screenshot({ type: "png" });
      const file = path.join(outDir, `${cut.prefix}-${String(i).padStart(2, "0")}.webp`);
      await sharp(png).webp({ quality: 66, effort: 5 }).toFile(file);
      total += (await stat(file)).size;
    }
    await context.close();
    console.log(`${cut.prefix}: ${FRAMES} frames`);
  }
} finally {
  await browser.close();
}
console.log(`Wrote ${FRAMES * cuts.length} frames to public/immersive/journey (${(total / 1024).toFixed(0)} KB in all; each device loads only its own cut)`);
