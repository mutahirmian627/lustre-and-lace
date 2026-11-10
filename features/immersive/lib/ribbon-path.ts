import { CatmullRomCurve3, Vector3 } from "three";
import { newFrame, spine, spineFrame, SPINE_LENGTH } from "@/features/immersive/lib/corridor";
import { ARCHES } from "@/features/immersive/lib/timeline";
import { RIBBON_OPENING_POINTS } from "@/features/immersive/lib/world";

/**
 * The ribbon's whole route: the approved opening (from the top of the gallery, through the doorway, into the hall),
 * then a weave down the corridor that threads every service arch.
 *
 * The weave is built from rows of (σ, sideways, height). At each arch the ribbon passes low and to one side, so the
 * camera sees it go through the opening; between arches it rises and crosses over, high above the camera, so it
 * never comes near the lens. The sides alternate, and the heights are chosen against the camera's own framing at
 * each arch (lib/corridor.ts). (As a safeguard the ribbon also gives way if it ever gets near the lens; see
 * scene/Ribbon.tsx.)
 */
interface Pass {
  sigma: number;
  /** Sideways from the centre line, right positive. */
  lateral: number;
  height: number;
}

// Calm in the first bays, where the ribbon is seen head-on and a big weave would foreshorten into a tangle; freer
// further down, where the corridor's bend turns it side-on.
const between = (k: number) => (ARCHES[k] + ARCHES[k + 1]) / 2;
const WEAVE: Pass[] = [
  { sigma: ARCHES[1], lateral: 0.3, height: 2.95 },
  { sigma: between(1), lateral: -0.2, height: 3.3 },
  { sigma: ARCHES[2], lateral: -1.2, height: 2.3 },
  { sigma: between(2), lateral: 0.3, height: 3.2 },
  { sigma: ARCHES[3], lateral: -1.5, height: 2.1 },
  { sigma: between(3), lateral: 0.3, height: 3.3 },
  { sigma: ARCHES[4], lateral: 0.3, height: 3.7 },
  { sigma: between(4), lateral: 0.5, height: 3.0 },
  { sigma: ARCHES[5], lateral: 1.5, height: 1.6 },
  { sigma: between(5), lateral: -0.3, height: 3.2 },
  { sigma: ARCHES[6], lateral: 1.4, height: 3.0 },
  { sigma: 54, lateral: 0.9, height: 3.2 },
  { sigma: 58, lateral: -0.5, height: 3.0 },
  { sigma: 62, lateral: 0.4, height: 2.2 },
  { sigma: 65.5, lateral: 0, height: 1.5 },
];

const frame = newFrame();
const weavePoints = WEAVE.map((pass) => {
  spineFrame(pass.sigma, frame);
  return new Vector3().copy(frame.point).addScaledVector(frame.right, pass.lateral).setY(pass.height);
});

export const ribbonCurve = new CatmullRomCurve3(
  [...RIBBON_OPENING_POINTS.map(([x, y, z]) => new Vector3(x, y, z)), ...weavePoints],
  false,
  "centripetal"
);
export const RIBBON_LENGTH = ribbonCurve.getLength();

/**
 * The route sampled every 10 cm: position and the two axes the ribbon's width and face are measured against.
 * Reading from this per frame is much cheaper than asking the curve.
 */
export const RIBBON_STEP = 0.1;
const UP = new Vector3(0, 1, 0);
const COUNT = Math.ceil(RIBBON_LENGTH / RIBBON_STEP) + 2;
export const ribbonTable = (() => {
  const position = new Float32Array(COUNT * 3);
  const widthAxis = new Float32Array(COUNT * 3);
  const faceAxis = new Float32Array(COUNT * 3);
  const p = new Vector3();
  const t = new Vector3();
  const w = new Vector3();
  const n = new Vector3();
  for (let i = 0; i < COUNT; i++) {
    const u = Math.min(1, (i * RIBBON_STEP) / RIBBON_LENGTH);
    ribbonCurve.getPointAt(u, p);
    ribbonCurve.getTangentAt(u, t);
    w.crossVectors(UP, t).normalize();
    n.crossVectors(t, w).normalize();
    position.set([p.x, p.y, p.z], i * 3);
    widthAxis.set([w.x, w.y, w.z], i * 3);
    faceAxis.set([n.x, n.y, n.z], i * 3);
  }
  return { count: COUNT, position, widthAxis, faceAxis };
})();

// How far along the ribbon (arc length s) it is level with each distance down the corridor (σ).
const arcs: number[] = [];
const sigmas: number[] = [];
(() => {
  const SAMPLE = 0.25;
  const spineCount = Math.ceil(SPINE_LENGTH / SAMPLE);
  const sx = new Float32Array(spineCount + 1);
  const sz = new Float32Array(spineCount + 1);
  const p = new Vector3();
  for (let i = 0; i <= spineCount; i++) {
    spine.getPointAt(Math.min(1, (i * SAMPLE) / SPINE_LENGTH), p);
    sx[i] = p.x;
    sz[i] = p.z;
  }
  let previous = 0;
  for (let s = 0; s <= RIBBON_LENGTH; s += 0.5) {
    ribbonCurve.getPointAt(s / RIBBON_LENGTH, p);
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i <= spineCount; i++) {
      const d = (sx[i] - p.x) ** 2 + (sz[i] - p.z) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    previous = Math.max(previous, best * SAMPLE);
    arcs.push(s);
    sigmas.push(previous);
  }
})();

/** The point on the ribbon (arc length) that is level with distance σ down the corridor. */
export function ribbonArcAt(sigma: number): number {
  let lo = 0;
  let hi = sigmas.length - 1;
  if (sigma <= sigmas[lo]) return arcs[lo];
  if (sigma >= sigmas[hi]) return arcs[hi];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (sigmas[mid] < sigma) lo = mid;
    else hi = mid;
  }
  const span = sigmas[hi] - sigmas[lo] || 1;
  return arcs[lo] + ((sigma - sigmas[lo]) / span) * (arcs[hi] - arcs[lo]);
}

/** Where, along the ribbon, each service arch is. The ribbon turns over as it passes through each. */
export const RIBBON_ARCH_ARCS = ARCHES.map((sigma) => ribbonArcAt(sigma));
