import { CatmullRomCurve3, Vector3 } from "three";

/**
 * The installation's measurements and the paths through it. Units are roughly metres; the floor is y = 0
 * and the viewer looks down the negative z axis.
 *
 *   gallery (ivory)  ──  portal in the wall  ──  hall (plum lacquer) with a rib every few metres
 *
 * The ribbon is the spine: it enters from the left of the gallery, sweeps across, threads the portal and
 * runs down the middle of the hall. The camera travels the same route a little behind it.
 */

/** The doorway in the gallery's far wall. */
export const PORTAL = { x: 2.2, width: 3.0, straight: 3.0 } as const;
export const WALL = { z: -6, depth: 0.8, width: 60, height: 10 } as const;

/** The hall behind the wall: an arch-section tunnel, wider than the doorway that leads into it. */
export const HALL = { width: 6.4, straight: 3.2, length: 32, ribEvery: 4 } as const;

/** Half the gap left between the two screen leaves while they are closed (the ribbon passes through it). */
export const SCREEN_GAP = 0.62;
/** Where the screen's leaves sit, inside the thickness of the wall. */
export const SCREEN_Z = WALL.z - 0.5;

/** The ribbon's control points: the shape of the spine. */
const RIBBON_POINTS = [
  [1.3, 6.0, -1.8],
  [0.85, 4.5, -2.3],
  [0.1, 3.5, -2.9],
  [0.45, 2.8, -3.7],
  [1.5, 2.3, -4.6],
  [2.1, 1.95, -5.5],
  [2.2, 2.3, -6.6],
  [PORTAL.x, 3.0, -8.6],
  [PORTAL.x, 3.25, -13],
  [PORTAL.x, 3.05, -19],
  [PORTAL.x, 2.7, -25],
  [PORTAL.x, 2.9, -37],
] as const;

export const ribbonCurve = new CatmullRomCurve3(
  RIBBON_POINTS.map(([x, y, z]) => new Vector3(x, y, z)),
  false,
  "centripetal"
);

/** The camera's route and where it looks as it goes, both parametrised 0..1 by the scroll. */
export const cameraCurve = new CatmullRomCurve3(
  [
    new Vector3(0.1, 1.5, 7.6),
    new Vector3(1.2, 1.55, 2.4),
    new Vector3(2.0, 1.55, -3.2),
    new Vector3(PORTAL.x, 1.48, -8.4),
    new Vector3(PORTAL.x, 1.42, -14.4),
  ],
  false,
  "centripetal"
);

export const lookCurve = new CatmullRomCurve3(
  [
    new Vector3(1.55, 1.85, -6),
    new Vector3(1.9, 1.8, -7.5),
    new Vector3(PORTAL.x, 2.1, -11),
    new Vector3(PORTAL.x, 2.3, -16),
    new Vector3(PORTAL.x, 2.4, -22),
  ],
  false,
  "centripetal"
);

/**
 * Scroll position -> how far along the camera's route (0..1, by distance), as straight segments between
 * landmarks: hold, approach the doorway (screen opening), pass through it, glide into the hall, hold.
 * The camera eases between them (see CameraRig), so the joins are not felt.
 */
const JOURNEY_KEYS: [number, number][] = [
  [0, 0],
  [0.015, 0],
  [0.26, 0.4],
  [0.5, 0.62],
  [0.62, 0.72],
  [0.9, 1],
  [1, 1],
];
export function journey(progress: number): number {
  for (let i = 1; i < JOURNEY_KEYS.length; i++) {
    const [p1, u1] = JOURNEY_KEYS[i];
    if (progress <= p1) {
      const [p0, u0] = JOURNEY_KEYS[i - 1];
      return u0 + ((progress - p0) / (p1 - p0)) * (u1 - u0);
    }
  }
  return 1;
}

/** How the scroll position (0..1) maps to the stages of the transition. Kept in one place so the 3D and the HTML agree. */
export const TIMELINE = {
  /** The screen's leaves slide apart between these two points. */
  screenOpen: [0.26, 0.5],
  /** The page colour turns from ivory to plum between these. */
  atmosphere: [0.36, 0.6],
} as const;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
