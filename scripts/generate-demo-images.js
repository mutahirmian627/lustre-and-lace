/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Draws the placeholder product illustrations in public/demo (9 jewellery types x 3 palettes).
 * They're brand-coloured stand-ins so the demo catalogue looks cohesive until real photos are
 * uploaded through the admin. Run: node scripts/generate-demo-images.js
 */
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright-core");

const OUT = path.join(__dirname, "..", "public", "demo");

const PALETTES = [
  { bg: ["#FFF7F7", "#F4C6CF"], gem: "#AF5071", gemLight: "#E58BA8", pearl: "#FFFDF9" },
  { bg: ["#F7F1E6", "#E3D5BA"], gem: "#4E3844", gemLight: "#8C6B7C", pearl: "#FFFFFF" },
  { bg: ["#6A5160", "#3F2B37"], gem: "#F4C6CF", gemLight: "#FFFFFF", pearl: "#F7ECE4" },
];

const GOLD = "url(#gold)";

function bezierPoints(p0, p1, p2, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0],
      (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1],
    ]);
  }
  return pts;
}

const gem = (x, y, r, p) =>
  `<g><path d="M${x} ${y - r} L${x + r * 0.85} ${y} L${x} ${y + r * 1.15} L${x - r * 0.85} ${y} Z" fill="${p.gem}" stroke="${GOLD}" stroke-width="${r * 0.18}" stroke-linejoin="round"/>` +
  `<path d="M${x} ${y - r} L${x + r * 0.3} ${y} L${x} ${y + r * 1.15} L${x - r * 0.3} ${y} Z" fill="${p.gemLight}" opacity="0.55"/></g>`;

const pearl = (x, y, r, p) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.pearl}" stroke="#00000014" stroke-width="1.5"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.28}" fill="#fff" opacity="0.9"/>`;

const sparkle = (x, y, s) =>
  `<path d="M${x} ${y - s} L${x + s * 0.22} ${y - s * 0.22} L${x + s} ${y} L${x + s * 0.22} ${y + s * 0.22} L${x} ${y + s} L${x - s * 0.22} ${y + s * 0.22} L${x - s} ${y} L${x - s * 0.22} ${y - s * 0.22} Z" fill="${GOLD}" opacity="0.85"/>`;

function drop(cx, top, p, withPearl) {
  return (
    `<circle cx="${cx}" cy="${top}" r="13" fill="${GOLD}"/>` +
    `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${top + 70}" stroke="${GOLD}" stroke-width="5"/>` +
    (withPearl ? pearl(cx, top + 140, 54, p) : gem(cx, top + 135, 52, p)) +
    `<circle cx="${cx}" cy="${top + 70}" r="9" fill="${GOLD}"/>`
  );
}

const DRAW = {
  necklace(p) {
    const pts = bezierPoints([170, 190], [400, 760], [630, 190], 24);
    return (
      `<path d="M170 190 Q400 760 630 190" fill="none" stroke="${GOLD}" stroke-width="6"/>` +
      pts.map(([x, y], i) => (i % 2 ? pearl(x, y, 20, p) : `<circle cx="${x}" cy="${y}" r="9" fill="${GOLD}"/>`)).join("") +
      gem(400, 520, 46, p)
    );
  },
  pendant(p) {
    return (
      `<path d="M215 170 L400 560 L585 170" fill="none" stroke="${GOLD}" stroke-width="5" stroke-dasharray="2 13" stroke-linecap="round"/>` +
      `<path d="M215 170 L400 560 L585 170" fill="none" stroke="${GOLD}" stroke-width="3"/>` +
      `<circle cx="400" cy="562" r="14" fill="${GOLD}"/>` +
      `<path d="M400 585 C300 650 320 760 400 770 C480 760 500 650 400 585 Z" fill="${p.gem}" stroke="${GOLD}" stroke-width="12" stroke-linejoin="round"/>` +
      `<path d="M400 610 C350 655 360 720 395 735 C375 700 380 650 400 610 Z" fill="${p.gemLight}" opacity="0.6"/>`
    );
  },
  choker(p) {
    const pts = bezierPoints([150, 250], [400, 470], [650, 250], 18);
    return (
      `<path d="M150 250 Q400 470 650 250" fill="none" stroke="${GOLD}" stroke-width="30" stroke-linecap="round"/>` +
      `<path d="M150 250 Q400 470 650 250" fill="none" stroke="${p.gem}" stroke-width="14" stroke-dasharray="2 24" stroke-linecap="round"/>` +
      pts.filter((_, i) => i % 3 === 0).map(([x, y]) => gem(x, y + 6, 16, p)).join("") +
      gem(400, 392, 54, p) +
      `<path d="M400 470 L400 540" stroke="${GOLD}" stroke-width="5"/>` + pearl(400, 575, 28, p)
    );
  },
  earrings(p) {
    return drop(285, 190, p, false) + drop(515, 190, p, true);
  },
  studs(p) {
    const stud = (x) =>
      `<circle cx="${x}" cy="400" r="104" fill="none" stroke="${GOLD}" stroke-width="16"/>` +
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return `<circle cx="${x + Math.cos(a) * 75}" cy="${400 + Math.sin(a) * 75}" r="9" fill="${p.pearl}" stroke="#0000001a"/>`;
      }).join("") + gem(x, 400, 34, p);
    return stud(260) + stud(540);
  },
  jhumka(p) {
    const one = (cx) =>
      `<circle cx="${cx}" cy="170" r="22" fill="${p.gem}" stroke="${GOLD}" stroke-width="7"/>` +
      `<path d="M${cx - 95} 330 C${cx - 95} 220 ${cx + 95} 220 ${cx + 95} 330 Z" fill="${GOLD}"/>` +
      `<path d="M${cx - 70} 322 C${cx - 70} 250 ${cx + 70} 250 ${cx + 70} 322 Z" fill="${p.gem}" opacity="0.35"/>` +
      Array.from({ length: 6 }, (_, i) => gem(cx - 60 + i * 24, 300, 8, p)).join("") +
      Array.from({ length: 5 }, (_, i) => {
        const x = cx - 72 + i * 36;
        return `<line x1="${x}" y1="334" x2="${x}" y2="${372 + (i % 2) * 22}" stroke="${GOLD}" stroke-width="3"/>` + pearl(x, 385 + (i % 2) * 22, 15, p);
      }).join("");
    return one(270) + one(530);
  },
  bangles(p) {
    const ring = (rx, ry, sw, rot, dash) =>
      `<g transform="rotate(${rot} 400 410)"><ellipse cx="400" cy="410" rx="${rx}" ry="${ry}" fill="none" stroke="${GOLD}" stroke-width="${sw}"/>` +
      (dash ? `<ellipse cx="400" cy="410" rx="${rx}" ry="${ry}" fill="none" stroke="${p.gem}" stroke-width="${sw * 0.35}" stroke-dasharray="3 22" stroke-linecap="round"/>` : "") +
      `</g>`;
    return ring(250, 175, 26, -12, true) + ring(235, 160, 18, -12, false) + ring(215, 140, 26, -12, true) + ring(195, 122, 14, -12, false);
  },
  ring(p) {
    return (
      `<circle cx="400" cy="480" r="175" fill="none" stroke="${GOLD}" stroke-width="34"/>` +
      `<circle cx="400" cy="480" r="175" fill="none" stroke="#ffffff55" stroke-width="6" stroke-dasharray="120 900" transform="rotate(-70 400 480)"/>` +
      `<path d="M335 330 L400 215 L465 330 Z" fill="${GOLD}"/>` + gem(400, 285, 76, p) +
      sparkle(540, 220, 22) + sparkle(260, 255, 14)
    );
  },
  set(p) {
    const pts = bezierPoints([140, 150], [400, 430], [660, 150], 16);
    return (
      `<path d="M140 150 Q400 430 660 150" fill="none" stroke="${GOLD}" stroke-width="22" stroke-linecap="round"/>` +
      pts.filter((_, i) => i % 2 === 0).map(([x, y]) => gem(x, y + 6, 17, p)).join("") +
      gem(400, 310, 56, p) +
      `<path d="M400 380 L400 440" stroke="${GOLD}" stroke-width="5"/>` + pearl(400, 470, 26, p) +
      drop(250, 520, p, false).replace(/(\d+\.?\d*)/g, (m) => m) +
      drop(550, 520, p, true)
    );
  },
};

function svgFor(kind, paletteIndex) {
  const p = PALETTES[paletteIndex];
  const dark = paletteIndex === 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E6C98E"/><stop offset="0.5" stop-color="#B58B45"/><stop offset="1" stop-color="#8A6A2E"/></linearGradient>
  <radialGradient id="glow" cx="50%" cy="42%" r="55%"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.12 : 0.65}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<rect width="800" height="800" fill="url(#bg)"/>
<rect width="800" height="800" fill="url(#glow)"/>
<circle cx="400" cy="400" r="330" fill="none" stroke="${dark ? "#D4B073" : "#B58B45"}" stroke-opacity="0.22" stroke-width="2"/>
<circle cx="400" cy="400" r="370" fill="none" stroke="${dark ? "#D4B073" : "#B58B45"}" stroke-opacity="0.12" stroke-width="2"/>
${sparkle(120, 130, 20)}${sparkle(690, 690, 26)}${sparkle(680, 140, 12)}${sparkle(110, 660, 14)}
<g filter="drop-shadow(0 14px 18px rgba(0,0,0,0.18))">${DRAW[kind](p)}</g>
</svg>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
  for (const kind of Object.keys(DRAW)) {
    for (let i = 0; i < PALETTES.length; i++) {
      await page.setContent(`<body style="margin:0">${svgFor(kind, i)}</body>`);
      await page.screenshot({ path: path.join(OUT, `${kind}-${i + 1}.jpg`), type: "jpeg", quality: 88 });
    }
  }
  await browser.close();
  console.log("Generated", Object.keys(DRAW).length * PALETTES.length, "images in public/demo");
})();
