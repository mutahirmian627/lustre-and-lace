/**
 * Smoke test for the live experience, for a running or deployed site:
 *
 *   npm run check:immersive -- https://your-preview.vercel.app [runs]
 *   npm run check:immersive                      (checks http://localhost:3000, 3 runs)
 *
 * On a capable browser every fresh load must (1) reach the live 3D scene within 15 seconds, and (2) be moving on its
 * own, with no scrolling and no pointer: the share of the scene that changes over 1.2 seconds must clear a floor at
 * the opening and again deep in the corridor. Either failing means a visitor could be looking at a dead page, so the
 * script exits with an error. Run it against the hosted build before calling anything ready.
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const runs = Number(process.argv[3] ?? 3);
const LIVE_WITHIN_MS = 15_000;
/** Share of pixels that must change over 1.2 s with nothing touched. (The approved Stage 1 opening measured about 4% per 0.4 s.) */
const MOTION_FLOOR = 0.01;
/** Where to look: scroll position in "scenes" (0 = the opening, 1.4 = deep in the corridor, 1.98 = the ivory hall). */
const POSITIONS = [0, 1.4, 1.98];

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: "msedge" });
  }
}

async function changedShare(page) {
  const clip = { x: Math.round(page.viewportSize().width * 0.42), y: 80, width: Math.round(page.viewportSize().width * 0.56), height: 700 };
  const grab = async () => sharp(await page.screenshot({ clip })).resize(240).greyscale().raw().toBuffer();
  const first = await grab();
  await page.waitForTimeout(1200);
  const second = await grab();
  let changed = 0;
  for (let i = 0; i < first.length; i++) if (Math.abs(first[i] - second[i]) > 12) changed++;
  return changed / first.length;
}

const browser = await launch();
let failures = 0;
try {
  for (let run = 1; run <= runs; run++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const started = Date.now();
    await page.goto(`${base}/`, { waitUntil: "load", timeout: 120_000 });
    let stage = "loading";
    while (Date.now() - started < LIVE_WITHIN_MS) {
      stage = await page.evaluate(() => document.querySelector(".immersive-root")?.dataset.stage ?? "loading");
      if (stage === "live") break;
      await page.waitForTimeout(250);
    }
    const reason = await page.evaluate(() => document.querySelector(".immersive-root")?.dataset.stageReason ?? "");
    if (stage !== "live") {
      failures++;
      console.log(`run ${run}: FAIL not live after ${LIVE_WITHIN_MS / 1000}s (stage "${stage}"${reason ? `, reason "${reason}"` : ""})`);
      await context.close();
      continue;
    }
    const liveAfter = Date.now() - started;
    const motion = [];
    for (const g of POSITIONS) {
      await page.evaluate((scene) => {
        const vh = window.innerHeight;
        window.scrollTo(0, Math.round(scene <= 1 ? scene * 2.3 * vh : (2.3 + (scene - 1) * 13.628) * vh));
      }, g);
      await page.waitForTimeout(3500); // let the camera settle completely: from here nothing is scrolling
      motion.push({ g, share: await changedShare(page) });
    }
    const still = motion.filter((m) => m.share < MOTION_FLOOR);
    const verdict = still.length ? "FAIL (looks dead)" : "ok";
    if (still.length) failures++;
    console.log(`run ${run}: live after ${(liveAfter / 1000).toFixed(1)}s; moving on its own: ${motion.map((m) => `scene ${m.g}: ${(m.share * 100).toFixed(1)}%`).join(", ")}  ${verdict}`);
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} of ${runs} runs FAILED` : `\nAll ${runs} runs live and moving.`);
process.exit(failures ? 1 : 0);
