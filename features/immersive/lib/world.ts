import { CatmullRomCurve3, Vector3 } from "three";
import { CLOSE_SIGMA, DOOR_SIGMA, HALL_START_SIGMA, IVORY_LENGTH, RIB_EVERY } from "@/features/immersive/lib/timeline";

// The pure scroll numbers live in timeline.ts (no 3D), and are re-exported here for the scene's convenience.
export { RUN, SERVICES_END, THRESHOLD_END, SERVICE_COUNT, clamp01, smoothstep, serviceIndexAt } from "@/features/immersive/lib/timeline";

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
export const HALL = { width: 6.4, straight: 3.2, length: DOOR_SIGMA, ribEvery: RIB_EVERY } as const;

/**
 * The ivory hall beyond the corridor's large lattice doorway: a spacious barrel vault in ivory ceramic, lit by lattice windows
 * down both sides. It continues the corridor's centre line (x = PORTAL.x) from σ = DOOR_SIGMA.
 */
export const IVORY = { width: 12, straight: 4.6, length: IVORY_LENGTH, windowEvery: 7 } as const;
/** The large doorway at the corridor's end: much bigger than the service arches (and the gallery's portal), nearly the corridor's own height. */
export const BIG_DOOR = { width: 4.6, straight: 3.5 } as const;

/** z of the hall's back face, where distance down the hall (σ, see timeline.ts) is zero. */
export const HALL_START_Z = WALL.z - WALL.depth;
/** The z that distance σ down the hall is at. The hall runs straight, so this is all the geometry there is. */
export const zAt = (sigma: number) => HALL_START_Z - sigma;

/** Half the gap left between the two screen leaves while they are closed (the ribbon passes through it). */
export const SCREEN_GAP = 0.62;
/** Where the screen's leaves sit, inside the thickness of the wall. */
export const SCREEN_Z = WALL.z - 0.5;

/**
 * The ribbon's control points: the shape of the spine. The first twelve are exactly the approved opening's route
 * (from the top of the gallery, through the doorway, to z = -37). The rest continue it down the corridor, threading
 * each service arch at a chosen height: the camera's eye is about 1.4 m up, so where the ribbon passes at about
 * 2.4 m to 2.9 m it goes by within a metre or so of the lens, and where it passes higher it is a distant crossing.
 */
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
  // --- the corridor ---
  [PORTAL.x, 2.9, -41],
  [PORTAL.x, 3.3, -45],
  [PORTAL.x, 3.5, -49],
  [PORTAL.x, 3.0, -53],
  [PORTAL.x, 2.6, -57],
  [PORTAL.x, 2.9, -61],
  [PORTAL.x, 2.7, -65],
  [PORTAL.x, 2.6, -69.5],
  [PORTAL.x, 2.9, -74],
  // --- through the large doorway (its plane is at z = -76.8) and into the ivory hall: the sculpture ---
  // It rises on the right, crosses high above, comes back down on the left and sweeps round the front to land on the
  // floor, as one loop hung in the middle of the room. No stretch of it is steeper than the ribbon's own opening.
  [PORTAL.x, 3.0, -78.6],
  [2.9, 3.5, -84],
  [4.1, 4.5, -89.5],
  [4.0, 5.5, -95],
  [2.6, 6.1, -98],
  [0.9, 5.7, -99],
  [-0.2, 4.7, -97],
  [0.2, 3.6, -94],
  [1.5, 2.8, -92],
  [3.0, 2.2, -92.5],
  [3.9, 1.4, -94.5],
  [3.5, 0.6, -97],
  [2.4, 0.1, -98.5],
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
 * The camera's route down the hall, for the services. It starts exactly where the opening route ends, so the two
 * join without a seam, and like the first it is parametrised by distance. It drifts a little from side to side and
 * up and down between the arches (kept well inside the walls), so the view is never a rail down the middle; at the
 * arches it takes the heights that bring it close beside the ribbon.
 */
export const hallCameraCurve = new CatmullRomCurve3(
  [
    new Vector3(PORTAL.x, 1.42, zAt(HALL_START_SIGMA)),
    new Vector3(2.2, 1.45, zAt(10.2)),
    new Vector3(1.7, 1.65, zAt(18.2)),
    new Vector3(2.6, 1.4, zAt(26.2)),
    new Vector3(2.0, 1.9, zAt(34.2)),
    new Vector3(2.7, 1.3, zAt(42.2)),
    new Vector3(1.8, 1.55, zAt(50.2)),
    new Vector3(2.2, 1.5, zAt(58.2)),
    // The threshold: on down the corridor's last stretch, through the large doorway, and into the ivory hall.
    new Vector3(2.2, 1.5, zAt(65)),
    new Vector3(2.2, 1.5, zAt(DOOR_SIGMA)),
    new Vector3(2.3, 1.6, zAt(73)),
    new Vector3(2.2, 1.65, zAt(CLOSE_SIGMA)),
  ],
  false,
  "centripetal"
);
/** Where it looks: about eight metres ahead, a little off to one side or another to match. */
export const hallLookCurve = new CatmullRomCurve3(
  [
    new Vector3(PORTAL.x, 2.4, -22),
    new Vector3(2.2, 2.2, zAt(10.2 + 8)),
    new Vector3(2.4, 2.1, zAt(18.2 + 8)),
    new Vector3(2.0, 2.3, zAt(26.2 + 8)),
    new Vector3(2.2, 1.8, zAt(34.2 + 8)),
    new Vector3(2.0, 2.6, zAt(42.2 + 8)),
    new Vector3(2.5, 2.0, zAt(50.2 + 8)),
    new Vector3(2.2, 2.0, zAt(58.2 + 8)),
    new Vector3(2.2, 2.1, zAt(65 + 8)),
    new Vector3(2.2, 2.4, zAt(DOOR_SIGMA + 8)),
    new Vector3(2.2, 3.0, zAt(80)),
    new Vector3(2.0, 3.5, zAt(86)),
  ],
  false,
  "centripetal"
);

/** How many rings the ribbon is built from: about one every 24 cm (41 cm on the lighter tier), as in the approved opening. */
export const ribbonSegments = (lite: boolean) => Math.round(ribbonCurve.getLength() / (lite ? 0.41 : 0.2435));


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
