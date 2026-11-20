import { DOOR_SIGMA, GATES, RIB_EVERY, WORK_END_SIGMA, WORK_PITCH_SIGMA, WORK_REACH, WORK_STOPS } from "@/features/immersive/lib/timeline";
import { HALL, IVORY, PORTAL, WALL, zAt } from "@/features/immersive/lib/world";

/**
 * Where the lights of "after dark" go. This is only a plan (numbers, no 3D), so it can be checked by a unit test and read
 * on its own: scene/NightFixtures.tsx turns it into things to draw.
 *
 * The idea is the one an architect's lighting designer would have: the building's own lines are lit rather than the room
 * being flooded. A glowing line at each arch's crown and down the length of the vault's springing; a few wall lights
 * (sconces), alternating side to side; a trail of small floor lights along the foot of the walls to guide the way in; pools
 * of light on the floor and a wash on the wall under and beside them. Warm and sparse: a light every four metres, not every one.
 *
 * Each light has a `delay` (0..1): its place in the order they come on. They come on from the doorway outwards (the gallery's
 * doorway first, then down the corridor, then into the ivory hall), so the change is a wave of light and not one switch.
 */

export type Zone = "gallery" | "hall" | "ivory";

export interface Glow {
  zone: Zone;
  /** World position of the light itself. */
  position: readonly [number, number, number];
  /** Its order in the wave that lights the room, 0 (first) to 1 (last). */
  delay: number;
}

/** A small bright point of light with a soft halo (a downlight, a sconce's lamp, a floor guide). */
export interface Lamp extends Glow {
  /** Halo size in metres. */
  size: number;
  /** 0..1: how bright, against the brightest. */
  level: number;
}

/** A pool of light on the floor or a wash on a wall: a soft ellipse of additive light. */
export interface Pool extends Glow {
  /** Which way the plane faces: "up" lies on the floor, "left"/"right" hang on a side wall, "front" on the end wall (facing the viewer). */
  facing: "up" | "left" | "right" | "front";
  width: number;
  height: number;
  level: number;
}

/** A thin glowing bar (the cove line, the body of a sconce). */
export interface Bar extends Glow {
  /** Full size along x, y, z, in metres. */
  size: readonly [number, number, number];
}

/**
 * A hanging brass lantern (a fanous): an onion-shaped body pierced with a lattice, a glowing core inside, hung from the vault
 * on a chain. Pierced lanterns throw a lattice of light on the floor beneath them, which is what makes the room feel
 * like a night in an old palace and not only a modern gallery.
 */
export interface Lantern extends Glow {
  /** Position of the lantern's bottom point. */
  position: readonly [number, number, number];
  /** Scale: the lantern is about 1.18 × this tall, in metres. */
  scale: number;
  /** Length of the chain above it, in metres (the chain's top is where it hangs from). */
  chain: number;
  /** A lattice of light on the floor beneath it (not for the wall-mounted ones). */
  floorPattern: boolean;
  /** A bracket from the wall to the top of its chain, as the bar's centre (wall-mounted lanterns only). */
  bracket?: Bar;
}

export interface FixturePlan {
  lamps: Lamp[];
  pools: Pool[];
  bars: Bar[];
  lanterns: Lantern[];
}

/** Where the wave starts, the doorway of the gallery's far wall, and how long the three zones take to be reached. */
const WAVE = { gallery: [0, 0.2], hall: [0.12, 0.62], ivory: [0.5, 0.9] } as const;
const wave = (zone: Zone, t: number) => {
  const [a, b] = WAVE[zone];
  return Math.min(1, Math.max(0, a + (b - a) * Math.min(1, Math.max(0, t))));
};

const X = PORTAL.x;
const springing = HALL.straight;

/** The hall's ribs, at their σ (distance down the hall). */
export const HALL_RIBS: number[] = Array.from({ length: Math.floor((HALL.length - 1) / RIB_EVERY) }, (_, k) => 2.2 + k * RIB_EVERY);
/** The ivory hall's ribs (between the works) and gates, at their σ. */
export const IVORY_RIBS: number[] = [...WORK_STOPS.slice(0, -1).map((stop) => stop + WORK_PITCH_SIGMA / 2 + WORK_REACH), ...GATES].sort((a, b) => a - b);

export function planFixtures(): FixturePlan {
  const lamps: Lamp[] = [];
  const pools: Pool[] = [];
  const bars: Bar[] = [];
  const lanterns: Lantern[] = [];

  // ---- the gallery: the doorway is the first thing to be lit -------------------------------------------------------
  // Two wall lights beside the doorway, and a wash up the wall and a pool on the floor in front of it.
  for (const side of [-1, 1] as const) {
    const x = X + side * (PORTAL.width / 2 + 1.5);
    const z = WALL.z + 0.1;
    lamps.push({ zone: "gallery", position: [x, 2.4, z], delay: wave("gallery", 0.05), size: 1.1, level: 1 });
    // A lantern on a bracket from the wall, either side of the doorway: the first thing lit, and the first thing seen.
    const top = 2.3 + 0.55 * 1.18 + 0.3;
    lanterns.push({
      zone: "gallery",
      position: [x, 2.3, WALL.z + 0.42],
      scale: 0.55,
      chain: 0.3,
      floorPattern: false,
      delay: wave("gallery", 0.05),
      bracket: { zone: "gallery", position: [x, top + 0.02, WALL.z + 0.22], size: [0.035, 0.035, 0.42], delay: wave("gallery", 0.05) },
    });
    pools.push({ zone: "gallery", position: [x, 2.6, z + 0.01], delay: wave("gallery", 0.05), facing: "right", width: 2.6, height: 5, level: 0.8 });
  }
  pools.push({ zone: "gallery", position: [X, 0.02, WALL.z + 2.2], delay: wave("gallery", 0.3), facing: "up", width: 6.5, height: 5.2, level: 0.9 });
  // A line of small floor lights leading from the gallery to the doorway.
  for (let i = 0; i < 5; i++) {
    for (const side of [-1, 1] as const) {
      lamps.push({ zone: "gallery", position: [X + side * 1.7, 0.05, WALL.z + 1.2 + i * 1.5], delay: wave("gallery", 0.4 + i * 0.12), size: 0.28, level: 0.7 });
    }
  }

  // ---- the corridor --------------------------------------------------------------------------------------------------
  const hallEnd = DOOR_SIGMA;
  // A downlight at the crown of each rib, with a pool of light under it.
  for (const sigma of HALL_RIBS) {
    const t = sigma / hallEnd;
    const z = zAt(sigma) + 0.17;
    lamps.push({ zone: "hall", position: [X, springing + 2.7, z], delay: wave("hall", t), size: 0.9, level: 1 });
    pools.push({ zone: "hall", position: [X, 0.02, zAt(sigma)], delay: wave("hall", t), facing: "up", width: 3.4, height: 3.8, level: 0.7 });
  }
  // A wall light midway between ribs, alternating sides, with a wash on the wall beside it.
  HALL_RIBS.slice(0, -1).forEach((sigma, k) => {
    const side = k % 2 === 0 ? -1 : 1;
    const t = (sigma + RIB_EVERY / 2) / hallEnd;
    const x = X + side * (HALL.width / 2 - 0.08);
    const z = zAt(sigma + RIB_EVERY / 2);
    lamps.push({ zone: "hall", position: [x - side * 0.05, 1.9, z], delay: wave("hall", t), size: 0.8, level: 0.9 });
    bars.push({ zone: "hall", position: [x - side * 0.03, 1.9, z], size: [0.06, 0.55, 0.08], delay: wave("hall", t) });
    pools.push({ zone: "hall", position: [x - side * 0.02, 2.2, z], delay: wave("hall", t), facing: side === -1 ? "right" : "left", width: 2.8, height: 3.4, level: 0.55 });
  });
  // The springing lines: a thin glow where the walls turn into the vault, the length of the corridor.
  for (const side of [-1, 1] as const) {
    bars.push({
      zone: "hall",
      position: [X + side * (HALL.width / 2 - 0.04), springing, zAt(hallEnd / 2)],
      size: [0.025, 0.025, hallEnd - 1],
      delay: wave("hall", 0.25),
    });
  }
  // Floor guide lights: small, low, every two metres along the foot of each wall.
  for (let sigma = 3; sigma < hallEnd - 1; sigma += 2) {
    for (const side of [-1, 1] as const) {
      lamps.push({ zone: "hall", position: [X + side * (HALL.width / 2 - 0.35), 0.07, zAt(sigma)], delay: wave("hall", sigma / hallEnd), size: 0.22, level: 0.6 });
    }
  }

  // Hanging lanterns on the plain ribs (the ones between the service arches), alternating sides, hung off to the side so they
  // never cross the ribbon's path or the camera's.
  HALL_RIBS.forEach((sigma, k) => {
    if (k % 2 === 0 || sigma > hallEnd - 6) return;
    const side = Math.floor(k / 2) % 2 === 0 ? -1 : 1;
    const offset = 1.75;
    const crown = springing + Math.sqrt((HALL.width / 2) ** 2 - offset ** 2) - 0.08;
    const chain = 1.0;
    const scale = 0.42;
    lanterns.push({
      zone: "hall",
      position: [X + side * offset, crown - chain - scale * 1.18, zAt(sigma) + 0.55],
      scale,
      chain,
      floorPattern: true,
      delay: wave("hall", sigma / hallEnd),
    });
  });

  // ---- the ivory hall ------------------------------------------------------------------------------------------------
  const ivoryT = (sigma: number) => (sigma - DOOR_SIGMA) / IVORY.length;
  IVORY_RIBS.forEach((sigma, k) => {
    const t = ivoryT(sigma);
    const side = k % 2 === 0 ? -1 : 1;
    const x = X + side * (IVORY.width / 2 - 0.12);
    const z = zAt(sigma);
    lamps.push({ zone: "ivory", position: [x - side * 0.05, 2.5, z], delay: wave("ivory", t), size: 1.1, level: 1 });
    bars.push({ zone: "ivory", position: [x - side * 0.03, 2.5, z], size: [0.07, 0.7, 0.08], delay: wave("ivory", t) });
    pools.push({ zone: "ivory", position: [x - side * 0.02, 2.9, z], delay: wave("ivory", t), facing: side === -1 ? "right" : "left", width: 3.4, height: 4.6, level: 0.6 });
    pools.push({ zone: "ivory", position: [x - side * 2.3, 0.02, z], delay: wave("ivory", t), facing: "up", width: 4.2, height: 4.4, level: 0.55 });
  });
  // The doorway into the ivory hall, lit as the gallery's was: a pair of lanterns just inside it, a pool of light on the floor, and a
  // wash on each wall, so that the step from the corridor into the work hall is a step into light, not into a dark room.
  const entry = DOOR_SIGMA + 3.5;
  for (const side of [-1, 1] as const) {
    const offset = 4.4;
    const crown = IVORY.straight + Math.sqrt((IVORY.width / 2) ** 2 - offset ** 2) - 0.1;
    const chain = 2.6;
    const scale = 0.95;
    lanterns.push({
      zone: "ivory",
      position: [X + side * offset, crown - chain - scale * 1.18, zAt(entry)],
      scale,
      chain,
      floorPattern: true,
      delay: wave("ivory", 0.02),
    });
    pools.push({ zone: "ivory", position: [X + side * (IVORY.width / 2 - 0.05), 2.8, zAt(entry)], delay: wave("ivory", 0.03), facing: side === -1 ? "right" : "left", width: 4.4, height: 5.4, level: 0.7 });
  }
  pools.push({ zone: "ivory", position: [X, 0.02, zAt(entry + 1)], delay: wave("ivory", 0.04), facing: "up", width: 9, height: 7, level: 0.85 });
  // Lanterns down the left side of the work hall (the works hang on the right), one for every second rib or gate.
  IVORY_RIBS.forEach((sigma, k) => {
    if (k % 2 !== 0) return;
    const offset = 4.3;
    const crown = IVORY.straight + Math.sqrt((IVORY.width / 2) ** 2 - offset ** 2) - 0.1;
    const chain = 2.8;
    const scale = 0.9;
    lanterns.push({
      zone: "ivory",
      position: [X - offset, crown - chain - scale * 1.18, zAt(sigma)],
      scale,
      chain,
      floorPattern: true,
      delay: wave("ivory", ivoryT(sigma)),
    });
  });
  // Small floor lights along the foot of both walls of the work hall, as in the corridor, to lead the way in.
  for (let sigma = DOOR_SIGMA + 2; sigma < DOOR_SIGMA + IVORY.length - 2; sigma += 3) {
    for (const side of [-1, 1] as const) {
      lamps.push({ zone: "ivory", position: [X + side * (IVORY.width / 2 - 0.45), 0.07, zAt(sigma)], delay: wave("ivory", ivoryT(sigma)), size: 0.24, level: 0.55 });
    }
  }
  // The sculpture's end of the room, where the last words are: a warm lit alcove in the end wall (see IvoryHall), a wash on that
  // wall, a wide pool of light under the sculpture, and a pair of lanterns either side of it.
  const sculptureSigma = WORK_END_SIGMA + 51;
  pools.push({ zone: "ivory", position: [X, 3.4, zAt(DOOR_SIGMA + IVORY.length) + 0.08], delay: wave("ivory", 0.95), facing: "front", width: 11, height: 8.5, level: 0.8 });
  pools.push({ zone: "ivory", position: [X + 0.9, 0.02, zAt(sculptureSigma)], delay: wave("ivory", 0.9), facing: "up", width: 10, height: 10, level: 0.95 });
  for (const side of [-1, 1] as const) {
    const offset = 4.7;
    const crown = IVORY.straight + Math.sqrt((IVORY.width / 2) ** 2 - offset ** 2) - 0.1;
    const chain = 2.4;
    const scale = 0.95;
    lanterns.push({
      zone: "ivory",
      position: [X + side * offset, crown - chain - scale * 1.18, zAt(sculptureSigma + 4)],
      scale,
      chain,
      floorPattern: true,
      delay: wave("ivory", 0.92),
    });
  }
  // (No long cove line in the ivory hall: it is wide and tall, and a line down its length cuts across the words and the works.
  // Its light comes from the wall lights on its ribs and gates and the washes beside them.)

  return { lamps, pools, bars, lanterns };
}
