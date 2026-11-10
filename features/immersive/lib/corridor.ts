import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Matrix4, Quaternion, Vector3 } from "three";
import { makeSpline } from "@/features/immersive/lib/spline";
import { ARCHES, DOOR_SIGMA, HALL_START_SIGMA, CLOSE_SIGMA, smoothstep } from "@/features/immersive/lib/timeline";
import { HALL } from "@/features/immersive/lib/world";

/**
 * The plum corridor behind the doorway: its centre line, how it is built from the one arch silhouette, where
 * the ribs and the seven service arches stand, how the camera is framed at each arch, and how each arch is lit.
 *
 * Distances along it are σ (metres from the doorway's back face; see lib/timeline.ts). The corridor runs straight
 * for the first dozen metres, exactly as the approved opening shows it, then makes a gentle S-bend and straightens
 * again for the end. Everything here is a function of σ, so the camera, the ribbon and the lights agree about
 * where they are.
 */

const UP = new Vector3(0, 1, 0);

/** The centre line in plan (x, z). Straight until about z = -22; the bends are gentle (about 20 degrees at most). */
const SPINE_PLAN: [number, number][] = [
  [2.2, -6.8],
  [2.2, -12],
  [2.2, -17],
  [2.2, -22],
  [2.8, -25.5],
  [4.0, -30.0],
  [4.3, -35.0],
  [2.95, -40.5],
  [1.0, -45.0],
  [0.2, -50.0],
  [0.8, -55.5],
  [2.0, -60.5],
  [2.2, -65.5],
  [2.2, -72],
  [2.2, -80],
];

export const spine = new CatmullRomCurve3(
  SPINE_PLAN.map(([x, z]) => new Vector3(x, 0, z)),
  false,
  "centripetal"
);
export const SPINE_LENGTH = spine.getLength();

export interface SpineFrame {
  point: Vector3;
  /** Horizontal unit vector along the corridor, the way the visitor faces. */
  tangent: Vector3;
  /** Horizontal unit vector to the visitor's right. */
  right: Vector3;
}

export const newFrame = (): SpineFrame => ({ point: new Vector3(), tangent: new Vector3(), right: new Vector3() });

export function spineFrame(sigma: number, out: SpineFrame = newFrame()): SpineFrame {
  const u = Math.min(1, Math.max(0, sigma / SPINE_LENGTH));
  spine.getPointAt(u, out.point);
  spine.getTangentAt(u, out.tangent);
  out.tangent.y = 0;
  out.tangent.normalize();
  out.right.crossVectors(out.tangent, UP).normalize();
  return out;
}

/** The corridor opens out very slightly as you go deeper (1.0 at the start, 1.2 at the door): a little more room each bay. */
export const hallScale = (sigma: number) => 1 + 0.2 * smoothstep(16, DOOR_SIGMA, sigma);

// ---- The camera ------------------------------------------------------------------------------------------

/**
 * How the camera is framed as it passes each arch. One row per arch, with a rest at either end. Values are blended
 * smoothly between rows (see lib/spline.ts), so the framing drifts from bay to bay.
 *
 *   x, h       sideways offset from the centre line (metres, right is positive) and eye height
 *   ahead      how far down the corridor the camera looks
 *   lookX/Y    where, at that distance, it aims (sideways and height)
 *   fov        extra field of view, in degrees (a slightly wider lens opens a bay out)
 *   roll       a touch of tilt, in radians
 *
 * The rows are chosen so the seven moments differ without being showy: the first is calm and frontal; the next
 * drifts left and sees the ribbon cross to the right; the third looks down from a little above; the fourth passes
 * close beside the ribbon on a wide lens; the fifth is low, looking up; the sixth is a long left-to-right
 * diagonal; the seventh is centred, high and wide, the exhale before the end.
 */
interface Frame {
  sigma: number;
  x: number;
  h: number;
  ahead: number;
  lookX: number;
  lookY: number;
  fov: number;
  roll: number;
}
const FRAMES: Frame[] = [
  { sigma: HALL_START_SIGMA, x: 0, h: 1.42, ahead: 7.6, lookX: 0, lookY: 2.4, fov: 0, roll: 0 },
  { sigma: ARCHES[0], x: 0, h: 1.45, ahead: 8, lookX: 0, lookY: 2.4, fov: 0, roll: 0 },
  { sigma: ARCHES[1], x: -0.9, h: 1.7, ahead: 7, lookX: 0.5, lookY: 2.3, fov: 1.5, roll: 0.01 },
  { sigma: ARCHES[2], x: 0.5, h: 2.1, ahead: 6.5, lookX: -0.3, lookY: 1.6, fov: 2.5, roll: -0.014 },
  { sigma: ARCHES[3], x: 1.1, h: 1.5, ahead: 6, lookX: -0.8, lookY: 2.2, fov: 4, roll: 0.02 },
  { sigma: ARCHES[4], x: 0, h: 1.0, ahead: 8, lookX: 0, lookY: 3.2, fov: 2, roll: 0 },
  { sigma: ARCHES[5], x: -1.1, h: 1.6, ahead: 9, lookX: 0.9, lookY: 2.0, fov: 3, roll: -0.017 },
  { sigma: ARCHES[6], x: 0, h: 1.9, ahead: 10, lookX: 0, lookY: 2.1, fov: 5, roll: 0 },
  { sigma: CLOSE_SIGMA, x: 0, h: 1.55, ahead: 9, lookX: 0, lookY: 1.9, fov: 2, roll: 0 },
];

const sigmas = FRAMES.map((f) => f.sigma);
const channel = (pick: (f: Frame) => number) => makeSpline(sigmas, FRAMES.map(pick));
const camX = channel((f) => f.x);
const camH = channel((f) => f.h);
const camAhead = channel((f) => f.ahead);
const camLookX = channel((f) => f.lookX);
const camLookY = channel((f) => f.lookY);
const camFov = channel((f) => f.fov);
const camRoll = channel((f) => f.roll);

const heading = (frame: SpineFrame) => Math.atan2(frame.tangent.x, -frame.tangent.z);

const frameA = newFrame();
const frameB = newFrame();
const frameC = newFrame();

export interface CameraPose {
  /** Extra field of view, degrees. */
  fov: number;
  /** Tilt about the view axis, radians. */
  roll: number;
}

/** Where the camera is and where it looks at distance σ down the corridor. Writes into `position` and `look`. */
export function cameraPose(sigma: number, position: Vector3, look: Vector3, out: CameraPose): CameraPose {
  spineFrame(sigma, frameA);
  position.copy(frameA.point).addScaledVector(frameA.right, camX(sigma)).addScaledVector(UP, camH(sigma));

  spineFrame(sigma + camAhead(sigma), frameB);
  look.copy(frameB.point).addScaledVector(frameB.right, camLookX(sigma)).setY(camLookY(sigma));

  // Lean a little into a bend, the way a camera operator would.
  spineFrame(sigma + 5, frameC);
  const turn = Math.atan2(Math.sin(heading(frameC) - heading(frameA)), Math.cos(heading(frameC) - heading(frameA)));
  out.fov = camFov(sigma);
  // (The bank eases in over the first bay, so it joins the approved opening's level horizon without a step.)
  out.roll = camRoll(sigma) - Math.max(-0.03, Math.min(0.03, turn * 0.25)) * smoothstep(HALL_START_SIGMA, ARCHES[0] + 3, sigma);
  return out;
}

// ---- The arches' lighting ---------------------------------------------------------------------------------

export interface LightSignature {
  /** Where the arch's light hangs, relative to the arch: sideways, height, and metres beyond it. */
  lateral: number;
  height: number;
  beyond: number;
  colour: string;
  /** Brightness when the camera is right at the arch. */
  peak: number;
}

/**
 * Each arch has its own light, so the seven feel different: a rose light overhead, an amber one from the side, a
 * cool white one from above, a rose-gold one low to the left, a gold uplight, a lilac one from the right, and at
 * the last a broad gold. Three lamps cycle through them as the camera travels (see scene/HallLights.tsx).
 */
export const LIGHT_SIGNATURES: readonly LightSignature[] = [
  { lateral: 0, height: 5, beyond: 1.5, colour: "#ff9db8", peak: 9 },
  { lateral: 1.4, height: 4.2, beyond: 1, colour: "#ffb48a", peak: 12 },
  { lateral: 0, height: 5.4, beyond: 0, colour: "#d9c8ff", peak: 13 },
  { lateral: -1.6, height: 3.2, beyond: 2, colour: "#ffa99a", peak: 13 },
  { lateral: 0, height: 1.2, beyond: 3, colour: "#ffc27a", peak: 12 },
  { lateral: 1.2, height: 4.5, beyond: 1, colour: "#c9b6ff", peak: 12 },
  { lateral: 0, height: 5, beyond: 2, colour: "#ffd08a", peak: 14 },
];

// ---- The ribs ---------------------------------------------------------------------------------------------

/**
 * Where the thinner ribs stand, with the service arches among them. Up to 38 m they are exactly the approved opening's
 * grid (every 4 m from 2.2), so the opening's view is unchanged; after that each bay has its own rhythm.
 */
export const THIN_RIBS = [
  2.2, 6.2, ARCHES[0], 14.2, ARCHES[1], 22.2, ARCHES[2], 30.2, ARCHES[3], 38.2, ARCHES[4], 44.7, ARCHES[5], 50.7,
  ARCHES[6], 57.2, 60.7, 64.2,
] as const;

/**
 * The service arches that gain a heavier collar once the visitor is inside: all but the first two, which are the
 * opening's ribs. (The collars fade in as the camera passes through the doorway, so the opening's view of the hall,
 * seen from the gallery, is unchanged.)
 */
export const HEAVY_ARCHES = ARCHES.slice(2);

const placement = new Matrix4();
const rotation = new Quaternion();
const yAxis = new Vector3(0, 1, 0);
const scaleVector = new Vector3();

/** One matrix per σ: stands a rib on the centre line, turned to face along the corridor and scaled with it. */
export function ribMatrices(positions: readonly number[]): Matrix4[] {
  return positions.map((sigma) => {
    const frame = spineFrame(sigma);
    const f = hallScale(sigma);
    rotation.setFromAxisAngle(yAxis, Math.atan2(-frame.tangent.x, -frame.tangent.z)); // faces the visitor, as the approved opening's ribs did
    return placement.clone().compose(frame.point, rotation, scaleVector.set(f, f, f));
  });
}

// ---- The hall itself --------------------------------------------------------------------------------------

interface ProfilePoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
}

/**
 * The hall as one surface: the arch silhouette (two walls and a vault, then the floor) swept along the centre
 * line. It is built to be seen from inside (outward-facing triangles drawn with the back-face material, as the
 * straight hall was), with smooth normals round the vault and crisp ones at the floor's edges.
 */
export function buildHallGeometry(lite: boolean): BufferGeometry {
  const stations = Math.ceil(DOOR_SIGMA / (lite ? 1.6 : 1));
  const arcSegments = lite ? 18 : 34;
  const r = HALL.width / 2;
  const straight = HALL.straight;

  const vault: ProfilePoint[] = [{ x: -r, y: 0, nx: -1, ny: 0 }];
  for (let k = 0; k <= arcSegments; k++) {
    const theta = Math.PI - (Math.PI * k) / arcSegments;
    vault.push({ x: r * Math.cos(theta), y: straight + r * Math.sin(theta), nx: Math.cos(theta), ny: Math.sin(theta) });
  }
  vault.push({ x: r, y: 0, nx: 1, ny: 0 });
  const floor: ProfilePoint[] = [
    { x: r, y: 0, nx: 0, ny: -1 },
    { x: -r, y: 0, nx: 0, ny: -1 },
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const frame = newFrame();

  for (const strip of [vault, floor]) {
    const base = positions.length / 3;
    const across = strip.length;
    for (let i = 0; i <= stations; i++) {
      const sigma = (i / stations) * DOOR_SIGMA;
      spineFrame(sigma, frame);
      const f = hallScale(sigma);
      for (const p of strip) {
        positions.push(
          frame.point.x + frame.right.x * p.x * f,
          p.y * f,
          frame.point.z + frame.right.z * p.x * f
        );
        normals.push(frame.right.x * p.nx, p.ny, frame.right.z * p.nx);
      }
    }
    for (let i = 0; i < stations; i++) {
      for (let j = 0; j < across - 1; j++) {
        const a = base + i * across + j;
        const b = a + 1;
        const c = a + across;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
