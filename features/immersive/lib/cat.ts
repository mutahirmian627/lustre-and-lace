import { DOOR_SIGMA, WORK_END_SIGMA, WORK_STOPS } from "@/features/immersive/lib/timeline";
import { PORTAL, WALL, zAt } from "@/features/immersive/lib/world";

/**
 * The cat's behaviour, as plain numbers (no 3D), so it can be tested: where it is, which way it faces, whether it is sitting
 * or walking, and how far through its stride it is.
 *
 * It lives a few metres ahead of the camera, on the floor, and keeps that place as the camera travels (so it is always in the
 * view, and seen from behind while the camera follows it). It is moved by the camera's own travel, never by the scroll directly,
 * so it can never run ahead of the scene or fall out of step with it:
 *
 *   camera moving  -> the cat stands, turns to the way it is going, and walks (legs follow the ground it covers)
 *   camera still   -> after a short pause the cat turns round to face the viewer and sits down
 *
 * At the very start it is not in front of the viewer at all: it is inside the alley, behind the doorway's frame, with only half of it
 * showing, peeking out towards us (see PEEK). It stays there until the camera has come within its usual distance of it, and then
 * walks off ahead; if the visitor scrolls back to the top, it walks back to its hiding place.
 */

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Exponential approach, independent of the frame rate. */
const damp = (current: number, target: number, rate: number, dt: number) => mix(current, target, 1 - Math.exp(-rate * dt));
const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
const dampAngle = (current: number, target: number, rate: number, dt: number) => current + wrap(target - current) * (1 - Math.exp(-rate * dt));

/**
 * Where the cat's feet land in the view: this many degrees below the middle of the picture. The cat stands as far ahead of the camera
 * as puts its feet there, whatever the camera's height and tilt, so it is always whole in the lower part of the frame (and never
 * hides the words, which sit to the left and in the middle) whether the camera looks level down a hall or up at a wall.
 */
export const FEET_BELOW_AXIS_DEGREES = 12.5;
/** The nearest and furthest it will stand ahead of the camera, in metres. */
export const CAT_DISTANCE = { min: 4.8, max: 17 } as const;
/** It is drawn a little larger the further away it stands (more than half of what it would take to keep its size on screen). */
const reference = 6.4;
/**
 * Where it hides at the start: just inside the hall, behind the left jamb of the doorway as seen from the camera's first place, so the
 * wall's edge cuts it down the middle and one half of its face (an ear, an eye, a cheek) peeks round. It is drawn larger there than
 * it is in front of us, since it is seventeen metres away.
 */
export const PEEK = { x: 0.85, z: -9.6, scale: 1.7 } as const;
/** How far beyond the hiding place the camera-led spot must be before the cat has quite left it, in metres. */
const LEAVE_OVER = 4;
/** How the camera makes room for the cat at the exhibition: back along its view, and tilted down, by this much. */
export const PULL = { back: 2.1, down: 0.75 } as const;

/**
 * 0 everywhere except along the exhibition, where it is 1: the camera there looks sideways at the wall with no floor in view, so it
 * stands a little further back and looks a little lower, just enough for the cat to have the floor in front of the works.
 * It eases in down the corridor's last metres and out again as the camera turns to the sculpture.
 */
export function exhibitPull(sigma: number, scene: number): number {
  if (scene <= 1) return 0;
  const first = WORK_STOPS[0];
  return smoothstep(first - 6, first - 1, sigma) * (1 - smoothstep(WORK_END_SIGMA + 0.5, WORK_END_SIGMA + 5, sigma));
}

export interface CatInput {
  /** The camera's place on the ground, before the pointer's small nudge (so a mouse never makes the cat walk). */
  travelX: number;
  travelZ: number;
  /** Where the camera looks, on the ground, and the heights of the camera and of the point it looks at. */
  lookX: number;
  lookZ: number;
  camY: number;
  lookY: number;
  /** 0..1, see exhibitPull. */
  pull: number;
}

/** The cat's resting place for a camera: ahead of it along its view, kept inside the architecture it is walking through. */
export function catAnchor(input: CatInput): { x: number; z: number; distance: number; scale: number; peek: number } {
  let dx = input.lookX - input.travelX;
  let dz = input.lookZ - input.travelZ;
  const length = Math.hypot(dx, dz);
  if (length < 1e-4) {
    dx = 0;
    dz = -1;
  } else {
    dx /= length;
    dz /= length;
  }
  // How far ahead puts its feet at the chosen angle below the middle of the picture, given how the camera is tilted.
  const pitch = Math.atan2(input.lookY - input.camY, length || 1);
  const below = (FEET_BELOW_AXIS_DEGREES * Math.PI) / 180 - pitch;
  const distance = Math.min(CAT_DISTANCE.max, Math.max(CAT_DISTANCE.min, below > 0.03 ? input.camY / Math.tan(below) : CAT_DISTANCE.max));
  let x = input.travelX + dx * distance;
  let z = input.travelZ + dz * distance;
  x = clampToArchitecture(x, z);
  let scale = mix(1, distance / reference, 0.6);
  // While the camera-led spot is nearer to us than its hiding place the cat stays hidden there; as that spot passes it and gets
  // ahead, the cat leaves, walking on down the way in front of us.
  const gone = smoothstep(0, LEAVE_OVER, PEEK.z - z);
  const peek = 1 - gone;
  x = mix(PEEK.x, x, gone);
  z = mix(PEEK.z, z, gone);
  scale = mix(PEEK.scale, scale, gone);
  return { x, z, distance, scale, peek };
}

/** Keeps a point on the floor inside the walls: free in the gallery, through the doorway, along the corridor, then the wide hall. */
export function clampToArchitecture(x: number, z: number): number {
  const dx = x - PORTAL.x;
  let half: number;
  if (z > WALL.z + 0.6) {
    // The gallery narrows to the doorway as the cat nears the wall.
    half = mix(40, 1.0, smoothstep(WALL.z + 5.5, WALL.z + 0.6, z));
  } else if (z > zAt(DOOR_SIGMA)) {
    // The doorway, then the corridor (3.2 m either side of the middle, less the cat's own width).
    half = mix(1.0, 2.3, smoothstep(WALL.z - 1, WALL.z - 4, z));
  } else {
    // The ivory hall: wide, but the works hang on its right wall.
    return Math.min(PORTAL.x + 4.4, Math.max(PORTAL.x - 5, x));
  }
  return PORTAL.x + Math.min(half, Math.max(-half, dx));
}

export interface CatPose {
  x: number;
  z: number;
  /** Which way it faces (radians about the vertical; the model's front is +z). */
  yaw: number;
  /** 1 sitting, 0 standing. */
  sit: number;
  /** How far through its stride, in radians. */
  phase: number;
  /** How large it is drawn (see catAnchor). */
  scale: number;
  /** 1 while it is at its hiding place at the start, peeking round the doorway; 0 once it has left it. */
  peek: number;
  /** How fast it is going, metres per second. */
  speed: number;
  /** Whether it is on the move (for the legs and the sway). */
  walking: boolean;
}

/** How fast the cat has to be going to be walking, and how slow before it starts to settle. */
const WALK_ABOVE = 0.45;
const REST_BELOW = 0.25;
/** How long the cat must have been still before it turns round and sits, in seconds. */
const PAUSE = 0.3;
/** Metres per full stride (one cycle of the legs). */
const STRIDE = 0.55;
const MAX_PHASE_RATE = 15;

export class CatBrain {
  pose: CatPose = { x: 0, z: 0, yaw: 0, sit: 1, phase: 0, scale: 1, peek: 1, speed: 0, walking: false };
  private started = false;
  private vx = 0;
  private vz = 0;
  private heading = 0;
  private still = 0;
  private moving = false;

  step(dt: number, input: CatInput) {
    const p = this.pose;
    const anchor = catAnchor(input);
    if (!this.started) {
      this.started = true;
      p.x = anchor.x;
      p.z = anchor.z;
      p.scale = anchor.scale;
      p.yaw = Math.atan2(input.travelX - p.x, input.travelZ - p.z);
      this.heading = p.yaw;
      return p;
    }
    if (dt <= 0) return p;

    // Move with the camera: the cat keeps its place (ahead of it, or at its hiding place until the camera is near), a touch
    // behind the exact spot, so it seems to walk there.
    const fromX = p.x;
    const fromZ = p.z;
    p.x = damp(p.x, anchor.x, 7, dt);
    p.z = damp(p.z, anchor.z, 7, dt);
    const catSpeed = Math.hypot(p.x - fromX, p.z - fromZ) / dt;

    // Whether it is walking depends on the cat's own movement (smoothed, so one odd frame is not a step), not the camera's: the camera
    // can be travelling while the cat is still hiding. And it faces the way it is going.
    this.vx = damp(this.vx, (p.x - fromX) / dt, 10, dt);
    this.vz = damp(this.vz, (p.z - fromZ) / dt, 10, dt);
    const speed = Math.hypot(this.vx, this.vz);
    if (speed > WALK_ABOVE) {
      this.moving = true;
      this.still = 0;
    } else if (speed < REST_BELOW) {
      this.still += dt;
      if (this.still > PAUSE) this.moving = false;
    }
    if (speed > REST_BELOW) this.heading = dampAngle(this.heading, Math.atan2(this.vx, this.vz), 12, dt);

    // Which way it faces: the way it is going, or, to sit, towards the viewer.
    const toViewer = Math.atan2(input.travelX - p.x, input.travelZ - p.z);
    const target = this.moving ? this.heading : toViewer;
    p.yaw = dampAngle(p.yaw, target, this.moving ? 9 : 7, dt);

    // It sits once it has turned to face the viewer, and stands the moment the camera moves.
    const turned = Math.abs(wrap(toViewer - p.yaw)) < 0.5;
    const wantsSit = !this.moving && turned ? 1 : 0;
    p.sit = damp(p.sit, wantsSit, wantsSit ? 4.5 : 10, dt);

    p.scale = damp(p.scale, anchor.scale, 4, dt);
    p.peek = anchor.peek * p.sit;
    p.speed = catSpeed;
    p.walking = this.moving || p.sit < 0.9;
    // The legs follow the ground it covers, and keep a gentle shuffle going while it turns on the spot.
    const rate = Math.min(MAX_PHASE_RATE, ((catSpeed + (this.moving ? 0.5 : 0)) * Math.PI * 2) / STRIDE);
    p.phase += rate * (1 - p.sit) * dt;
    return p;
  }
}
