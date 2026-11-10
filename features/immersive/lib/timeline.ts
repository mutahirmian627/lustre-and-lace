/**
 * The numbers that say where things are along the scroll, with no 3D in them, so the page's scroll listener
 * can use them without pulling the 3D library into the first load. (The 3D side, lib/corridor.ts and
 * lib/world.ts, builds its curves from the same numbers.)
 *
 * Distances down the hall are written σ ("sigma"): metres along the hall's centre line, 0 at the doorway's
 * back face. The opening ends with the camera at σ = 7.6.
 */

/**
 * How tall the scroll run is, in screens: the opening (gallery to hall), then the services and the close.
 * Both the page's CSS height and the scroll maths read these, so they can't disagree.
 */
export const RUN = { opening: 2.3, services: 5.6 } as const;

/** Of the services run, the part that is the seven bays; the rest is the close, where the camera comes to rest. */
export const SERVICES_END = 0.88;

export const SERVICE_COUNT = 7;

/** Where the camera is when the opening ends, where the services end, and where the close comes to rest. */
export const HALL_START_SIGMA = 7.6;
export const SERVICES_END_SIGMA = 55;
export const CLOSE_SIGMA = 59;
/** The far end of the corridor, where its door of light is (for now). */
export const DOOR_SIGMA = 66;

/**
 * The seven service arches, one per service. The first four stand on the approved opening's rib grid (every 4 m from
 * 2.2), so the view through the doorway at the opening is unchanged. Deeper in, where the corridor has bent out of
 * that view, the bays tighten from 8 m to 6 m, so the rhythm quickens towards the end.
 */
export const ARCHES = [10.2, 18.2, 26.2, 34.2, 41.7, 47.7, 53.7] as const;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/** Distance from σ to the nearest service arch. */
function distanceToArch(sigma: number): number {
  let best = Infinity;
  for (const arch of ARCHES) best = Math.min(best, Math.abs(sigma - arch));
  return best;
}

/**
 * How fast the camera travels at σ, relative to its average: quickest as it passes under an arch, easing in
 * and out of each bay. This is what gives each service a beat (approach, pass, release) instead of a constant glide.
 */
export function pace(sigma: number): number {
  const d = distanceToArch(sigma);
  return 0.7 + 0.62 * Math.exp(-((d / 2.3) ** 2));
}

// Scroll-time for each step of σ: the integral of 1 / pace. Built once; it is a few hundred numbers.
const STEP = 0.1;
const TABLE_END = SERVICES_END_SIGMA;
const COUNT = Math.round((TABLE_END - HALL_START_SIGMA) / STEP);
const elapsed = new Float64Array(COUNT + 1);
for (let i = 1; i <= COUNT; i++) {
  const sigma = HALL_START_SIGMA + (i - 0.5) * STEP;
  elapsed[i] = elapsed[i - 1] + STEP / pace(sigma);
}
const TOTAL_TIME = elapsed[COUNT];

/** Services run progress (0..1) -> how far down the hall the camera is (σ, in metres). */
export function hallSigma(s: number): number {
  if (s <= 0) return HALL_START_SIGMA;
  if (s <= SERVICES_END) {
    const target = (s / SERVICES_END) * TOTAL_TIME;
    let lo = 0;
    let hi = COUNT;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (elapsed[mid] <= target) lo = mid;
      else hi = mid;
    }
    const span = elapsed[hi] - elapsed[lo] || 1;
    return HALL_START_SIGMA + (lo + (target - elapsed[lo]) / span) * STEP;
  }
  // The close: a slow, easing-out glide to rest.
  const t = clamp01((s - SERVICES_END) / (1 - SERVICES_END));
  return SERVICES_END_SIGMA + (CLOSE_SIGMA - SERVICES_END_SIGMA) * (1 - (1 - t) * (1 - t));
}

/**
 * Which service is on show. Service i belongs to arch i: its words arrive as the arch comes within 3 m ahead
 * (approach), stay while the camera passes under it, and give way when the next arch comes within 3 m.
 */
export function serviceIndexFromSigma(sigma: number): number {
  let count = 0;
  for (const arch of ARCHES) if (arch < sigma + 3) count++;
  return Math.min(SERVICE_COUNT - 1, Math.max(0, count - 1));
}

export function serviceIndexAt(s: number): number {
  return serviceIndexFromSigma(hallSigma(s));
}
