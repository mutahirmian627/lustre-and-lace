/**
 * The numbers that say where things are along the scroll, with no 3D in them, so the page's scroll listener
 * can use them without pulling the 3D library into the first load. (The 3D side, lib/corridor.ts and
 * lib/world.ts, builds its curves from the same numbers.)
 *
 * Distances down the hall are written σ ("sigma"): metres along the hall's centre line, 0 at the doorway's
 * back face. The opening ends with the camera at σ = 7.6.
 */

/**
 * How tall the scroll run is, in screens: the opening (gallery to hall), then everything after it: the seven bays of
 * services, the threshold (down the corridor's last stretch, through the large lattice doorway) and the ivory hall where
 * the camera comes to rest. Both the page's CSS height and the scroll maths read these, so they can't disagree.
 */
const BAYS_SCREENS = 4.928;
const THRESHOLD_SCREENS = 2.1;
const HALL_SCREENS = 1.3;
export const RUN = { opening: 2.3, services: BAYS_SCREENS + THRESHOLD_SCREENS + HALL_SCREENS } as const;

/** Of the services run (0..1), where the seven bays end, where the threshold ends (the camera is inside the ivory hall), and the end. */
export const SERVICES_END = BAYS_SCREENS / RUN.services;
export const THRESHOLD_END = (BAYS_SCREENS + THRESHOLD_SCREENS) / RUN.services;

export const SERVICE_COUNT = 7;

/** Where the camera is when the opening ends, where the seven bays end, where the threshold ends, and where it comes to rest. */
export const HALL_START_SIGMA = 7.6;
export const SERVICES_END_SIGMA = 59;
export const THRESHOLD_END_SIGMA = 73;
export const CLOSE_SIGMA = 75.5;
/** The far end of the corridor: the large lattice doorway into the ivory hall. */
export const DOOR_SIGMA = 70;
/** The ivory hall beyond the doorway: how long it is. */
export const IVORY_LENGTH = 34;
/** Between these two distances down the hall the page turns from plum to ivory: the camera is passing through the doorway. */
export const FLIP_SIGMA = [66, 72] as const;
/** Where the contact words arrive: the camera has come through into the ivory hall. */
export const CONTACT_SIGMA = [73, 75] as const;

/** The hall's ribs stand every 4 m from 2.2: exactly the approved opening's grid. */
export const RIB_EVERY = 4;

/**
 * The seven service arches, one per service: every second rib of the approved opening's hall, so the view
 * through the doorway is unchanged, and an 8 m bay between each.
 */
export const ARCHES = [10.2, 18.2, 26.2, 34.2, 42.2, 50.2, 58.2] as const;

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
  if (s <= THRESHOLD_END) {
    // The threshold: down the last stretch of the corridor, slowly, to the doorway and through it. A little linear
    // travel keeps the camera moving from the last arch, and the rest eases in and out.
    const t = clamp01((s - SERVICES_END) / (THRESHOLD_END - SERVICES_END));
    return SERVICES_END_SIGMA + (THRESHOLD_END_SIGMA - SERVICES_END_SIGMA) * (0.3 * t + 0.7 * smoothstep(0, 1, t));
  }
  // The ivory hall: a slow, easing-out glide to rest in front of the sculpture.
  const t = clamp01((s - THRESHOLD_END) / (1 - THRESHOLD_END));
  return THRESHOLD_END_SIGMA + (CLOSE_SIGMA - THRESHOLD_END_SIGMA) * (1 - (1 - t) * (1 - t));
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

/**
 * A service arch's lattice veil, from how far ahead of the camera the arch is (metres along the corridor; negative once
 * the camera has passed it). The veil is invisible while the arch is far (so the approved opening is untouched), closed
 * and showing its lattice as the arch comes into the near corridor, then parts as the camera closes in, and stays parted
 * behind it. `from` and `to` are where the parting starts and finishes, and differ a little from arch to arch.
 */
export function veilAt(ahead: number, from = 9, to = 2.6, fadeNear = 14, fadeFar = 22): { fade: number; open: number } {
  return {
    fade: 1 - smoothstep(fadeNear, fadeFar, ahead),
    open: 1 - smoothstep(to, from, ahead),
  };
}
