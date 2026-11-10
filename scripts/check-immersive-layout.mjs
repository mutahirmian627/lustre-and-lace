/**
 * Layout audit for /immersive: at every stop of the journey, on many screen shapes (small phones, landscape phones,
 * tablets, laptops, and desktops zoomed to 200%), every visible line of text must sit inside the screen, below the
 * navigation bar, clear of the preview label, and the page must not scroll sideways.
 *
 *   npm run dev                         (in one terminal)
 *   npm run check:immersive-layout      (or: node scripts/check-immersive-layout.mjs <url>)
 *
 * The scroll positions come from the same maths the page uses (lib/timeline.ts), so the audit follows the journey if it
 * is changed. It exits with an error if any line of text is cut off or covered.
 */
import { chromium } from "@playwright/test";
import * as timeline from "../features/immersive/lib/timeline.ts";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const scene = (sigma) => 1 + timeline.progressForSigma(sigma);
/** Where to look: [label, scroll position in scenes]. */
const STOPS = [
  ["opening", 0],
  ["approach", 0.9],
  ...timeline.ARCHES.map((arch, i) => [`service ${i + 1}`, scene(arch - 1.2)]),
  ...timeline.WORK_STOPS.map((stop, i) => [`work ${i + 1}`, scene(stop)]),
  ...timeline.PROCESS_STOPS.map((stop, i) => [`process ${i + 1}`, scene(stop)]),
  ["contact", 2],
];

const SCREENS = [
  ["320x568 (small phone)", 320, 568],
  ["360x640", 360, 640],
  ["375x667 (iPhone SE)", 375, 667],
  ["390x844", 390, 844],
  ["414x896", 414, 896],
  ["667x375 (phone, landscape)", 667, 375],
  ["844x390 (phone, landscape)", 844, 390],
  ["768x1024 (tablet)", 768, 1024],
  ["1024x768", 1024, 768],
  ["1280x720", 1280, 720],
  ["1440x900", 1440, 900],
  ["1920x1080", 1920, 1080],
  ["720x450 (laptop at 200% zoom)", 720, 450],
  ["640x360 (desktop at 200% zoom)", 640, 360],
];

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: "msedge" });
  }
}

/** Runs in the page: the visible lines of text, and where they are. */
function audit() {
  const header = document.querySelector(".imm-nav-row");
  const headerBottom = header ? header.getBoundingClientRect().bottom : 72;
  const label = document.querySelector(".imm-chrome")?.getBoundingClientRect();
  const problems = [];
  const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.trim();
    const el = node.parentElement;
    if (!text || !el || el.closest(".sr-only, .imm-skip")) continue;
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    // Only what is properly on show: not a fading one, and not a scene that is not in its phase.
    let faded = false;
    for (let e = el; e; e = e.parentElement) if (Number(getComputedStyle(e).opacity) < 0.9) faded = true;
    if (faded) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (rect.width < 1 || rect.height < 1) continue;
      const out = [];
      if (rect.left < -0.5) out.push(`left edge ${Math.round(rect.left)}px`);
      if (rect.right > innerWidth + 0.5) out.push(`right edge ${Math.round(rect.right - innerWidth)}px past the screen`);
      if (rect.bottom > innerHeight + 0.5) out.push(`bottom ${Math.round(rect.bottom - innerHeight)}px past the screen`);
      if (rect.top < headerBottom - 2) out.push(`top ${Math.round(headerBottom - rect.top)}px under the navigation bar`);
      if (label && rect.left < label.right && rect.right > label.left && rect.top < label.bottom && rect.bottom > label.top) out.push("covered by the preview label");
      if (out.length) problems.push(`"${text.slice(0, 36)}": ${out.join(", ")}`);
    }
  }
  const sideways = document.documentElement.scrollWidth - innerWidth;
  if (sideways > 1) problems.push(`the page scrolls sideways by ${sideways}px`);
  return problems;
}

const browser = await launch();
let failures = 0;
let checks = 0;
try {
  for (const [name, width, height] of SCREENS) {
    const phone = width < 900;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: phone, hasTouch: phone });
    const page = await context.newPage();
    await page.goto(`${base}/immersive`, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(1200);
    const bad = [];
    for (const [label, position] of STOPS) {
      await page.evaluate(
        ([g, opening, run]) => {
          const vh = window.innerHeight;
          window.scrollTo(0, Math.round(g <= 1 ? g * opening * vh : (opening + (g - 1) * run) * vh));
        },
        [position, timeline.RUN.opening, timeline.RUN.services]
      );
      await page.waitForTimeout(900); // the words fade over half a second
      checks++;
      const problems = await page.evaluate(audit);
      for (const problem of [...new Set(problems)]) bad.push(`  ${label}: ${problem}`);
    }
    failures += bad.length;
    console.log(`${bad.length ? "FAIL" : "ok  "} ${name}`);
    for (const line of bad) console.log(line);
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(failures ? `\n${failures} problem(s) in ${checks} checks` : `\nAll ${checks} checks clear.`);
process.exit(failures ? 1 : 0);
