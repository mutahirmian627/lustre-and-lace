import { CLOSE_SIGMA, PROCESS_STOPS, THRESHOLD_END_SIGMA, WORK_END_SIGMA, WORK_REACH, WORK_STOPS } from "@/features/immersive/lib/timeline";
import { PORTAL } from "@/features/immersive/lib/world";

/**
 * The camera's route along the ivory hall: the exhibition, then the turn to the sculpture. Unlike the corridor's routes
 * (curves, parametrised by distance along them), this is keyed directly by σ, because here the view swings from the
 * hall's right wall to its far end, and a curve that swings sideways would no longer advance at the pace of the walk.
 *
 * At each stop the camera stands a little left of the hall's centre line and looks at the work on the right wall; between
 * stops it walks on, looking along the wall ahead of it; after the last it turns to look down the room at the sculpture.
 */

/** The hall's right wall, where the works hang (x of its inner face). */
export const WALL_X = PORTAL.x + 6;

export interface Pose {
  /** Where the camera is (x and height; z follows from σ). */
  x: number;
  y: number;
  /** Where it looks: x, height, and how far down the hall (σ). */
  lx: number;
  ly: number;
  lsigma: number;
}

interface Key extends Pose {
  sigma: number;
}

const at = (stop: number, x = 1.5, y = 1.6, lx = WALL_X, ly = 2.5, lead = WORK_REACH + 0.5): Key => ({
  sigma: stop,
  x,
  y,
  lx,
  ly,
  lsigma: stop + lead,
});

/** Walking between two stops: further along the hall, looking ahead along the wall. */
const between = (from: number, to: number): Key => ({
  sigma: (from + to) / 2,
  x: 1.85,
  y: 1.62,
  lx: WALL_X - 0.6,
  ly: 2.55,
  lsigma: (from + to) / 2 + 5.5,
});

export const GALLERY_KEYS: readonly Key[] = [
  // Where the corridor's route leaves off: just inside the doorway, looking down the hall.
  { sigma: THRESHOLD_END_SIGMA, x: 2.3, y: 1.6, lx: 2.2, ly: 2.9, lsigma: THRESHOLD_END_SIGMA + 7 },
  at(WORK_STOPS[0]),
  between(WORK_STOPS[0], WORK_STOPS[1]),
  at(WORK_STOPS[1], 1.5, 1.55),
  between(WORK_STOPS[1], WORK_STOPS[2]),
  at(WORK_STOPS[2], 1.5, 1.6, WALL_X, 2.6),
  between(WORK_STOPS[2], WORK_STOPS[3]),
  at(WORK_STOPS[3], 1.6),
  // The turn from the wall to the hall: the camera comes to the middle of the room and looks down it, at the first gate.
  { sigma: 101, x: 2.0, y: 1.62, lx: 4.2, ly: 2.4, lsigma: 109 },
  // The process: at each stop the camera stands in the middle of the hall, five metres before a gate, and looks through it.
  ...PROCESS_STOPS.flatMap((stop, i): Key[] => {
    const stand = { sigma: stop, x: i % 2 ? 2.4 : 2.0, y: 1.6, lx: 2.2, ly: 2.35, lsigma: stop + 10 };
    const next = PROCESS_STOPS[i + 1];
    return next === undefined ? [stand] : [stand, { sigma: (stop + next) / 2, x: 2.2, y: 1.63, lx: 2.2, ly: 2.5, lsigma: (stop + next) / 2 + 9 }];
  }),
  // The close: through the last gate and on to rest, looking down the room at the sculpture.
  { sigma: 136, x: 2.2, y: 1.62, lx: 2.1, ly: 3.0, lsigma: 146 },
  { sigma: CLOSE_SIGMA, x: PORTAL.x, y: 1.65, lx: 2.0, ly: 3.5, lsigma: CLOSE_SIGMA + 11 },
];

const KEYS = ["x", "y", "lx", "ly", "lsigma"] as const;

/** A cubic Hermite spline through the keys (tangents from the neighbours), so every number glides through them. */
export function galleryPose(sigma: number): Pose {
  const last = GALLERY_KEYS.length - 1;
  const s = Math.min(GALLERY_KEYS[last].sigma, Math.max(GALLERY_KEYS[0].sigma, sigma));
  let i = 0;
  while (i < last - 1 && s > GALLERY_KEYS[i + 1].sigma) i++;
  const k0 = GALLERY_KEYS[i];
  const k1 = GALLERY_KEYS[i + 1];
  const span = k1.sigma - k0.sigma;
  const t = (s - k0.sigma) / span;
  const before = GALLERY_KEYS[Math.max(0, i - 1)];
  const after = GALLERY_KEYS[Math.min(last, i + 2)];
  const t2 = t * t;
  const t3 = t2 * t;
  const pose = {} as Pose;
  for (const name of KEYS) {
    // Slopes (per metre of σ) at each end of this span.
    const m0 = (k1[name] - before[name]) / (k1.sigma - before.sigma || 1);
    const m1 = (after[name] - k0[name]) / (after.sigma - k0.sigma || 1);
    pose[name] = (2 * t3 - 3 * t2 + 1) * k0[name] + (t3 - 2 * t2 + t) * span * m0 + (-2 * t3 + 3 * t2) * k1[name] + (t3 - t2) * span * m1;
  }
  return pose;
}

/** The last stop's σ, for the tests. */
export const GALLERY_LAST_STOP = WORK_END_SIGMA;
