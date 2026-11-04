import { CubeTexture, SRGBColorSpace } from "three";

/**
 * The reflections the gem sees: a small "photo studio" painted in code, as the six faces of a cube.
 *
 * Why not use the usual environment helper? It converts an environment into a blurred, multi-level
 * reflection map on the graphics card, and compiling the shaders for that step froze the page for
 * over two seconds on a typical Windows laptop. A cut gem's facets are near-mirrors, so they don't need
 * that blur. A plain cube texture read directly by a simple material costs almost nothing to compile.
 *
 * Each light is a panel at a direction around the gem, with a size (in degrees) and a colour. A pixel
 * lights up where its direction falls inside a panel; edges are slightly soft. The values are stored in
 * 8 bits, so "brightness" beyond white comes from the material's reflectivity, not from here.
 */

const FACE_SIZE = 128;

interface Panel {
  /** Where the light sits, as a direction from the gem (x right, y up, z towards the viewer). */
  dir: [number, number, number];
  /** Half-width and half-height in degrees, on the side facing the gem. */
  half: [number, number];
  colour: [number, number, number];
  strength: number;
}

const BASE: [number, number, number] = [78, 36, 58]; // a deep plum-rose room: unlit facets stay rich and dark, lit ones glow against them

const PANELS: Panel[] = [
  // Big soft key light, upper left, warm white.
  { dir: [-0.55, 0.5, 0.65], half: [34, 20], colour: [255, 241, 226], strength: 1 },
  // Raspberry rim light from the right, and more pink around the other sides so every facet has some.
  { dir: [0.8, 0.1, 0.45], half: [20, 40], colour: [244, 122, 166], strength: 1 },
  { dir: [-0.9, -0.15, 0.25], half: [22, 36], colour: [236, 98, 150], strength: 0.95 },
  { dir: [0.25, 0.55, 0.75], half: [30, 14], colour: [250, 170, 198], strength: 0.9 },
  { dir: [-0.2, -0.5, 0.8], half: [26, 12], colour: [232, 110, 142], strength: 0.9 },
  // Gold kicker from below.
  { dir: [0, -0.8, 0.5], half: [40, 14], colour: [226, 188, 120], strength: 1 },
  // Overhead white.
  { dir: [0, 1, -0.25], half: [22, 22], colour: [255, 255, 255], strength: 0.9 },
  // Thin bright strips: each facet that turns to face one flashes, which reads as sparkle.
  { dir: [-0.38, 0.05, 0.92], half: [3, 28], colour: [255, 255, 255], strength: 1 },
  { dir: [0.34, 0.3, 0.9], half: [2.5, 24], colour: [255, 217, 230], strength: 1 },
  { dir: [0.05, -0.38, 0.92], half: [26, 2.5], colour: [255, 233, 184], strength: 1 },
  { dir: [0.9, -0.2, -0.4], half: [2.5, 26], colour: [255, 255, 255], strength: 0.9 },
];

type Vec3 = [number, number, number];

const normalise = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
};
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** The direction a pixel on a cube face looks towards. u runs right and v runs down across the face. */
function faceDirection(face: number, u: number, v: number): Vec3 {
  switch (face) {
    case 0: return [1, -v, -u]; //  +x
    case 1: return [-1, -v, u]; //  -x
    case 2: return [u, 1, v]; //    +y
    case 3: return [u, -1, -v]; //  -y
    case 4: return [u, -v, 1]; //   +z
    default: return [-u, -v, -1]; // -z
  }
}

/** Precompute each panel's centre and its two sideways axes, so pixels can be tested quickly. */
function preparePanels() {
  return PANELS.map((panel) => {
    const centre = normalise(panel.dir);
    const reference: Vec3 = Math.abs(centre[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const right = normalise(cross(reference, centre));
    const up = cross(centre, right);
    return {
      centre,
      right,
      up,
      tanW: Math.tan((panel.half[0] * Math.PI) / 180),
      tanH: Math.tan((panel.half[1] * Math.PI) / 180),
      colour: panel.colour,
      strength: panel.strength,
    };
  });
}

/** Builds the cube. Browser only (it paints onto canvases). */
export function createStudioCube(): CubeTexture {
  const panels = preparePanels();
  const faces: HTMLCanvasElement[] = [];

  for (let face = 0; face < 6; face++) {
    const canvas = document.createElement("canvas");
    canvas.width = FACE_SIZE;
    canvas.height = FACE_SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas is not available");
    const image = context.createImageData(FACE_SIZE, FACE_SIZE);

    for (let y = 0; y < FACE_SIZE; y++) {
      for (let x = 0; x < FACE_SIZE; x++) {
        const u = ((x + 0.5) / FACE_SIZE) * 2 - 1;
        const v = ((y + 0.5) / FACE_SIZE) * 2 - 1;
        const direction = normalise(faceDirection(face, u, v));

        // A faint vertical gradient, brighter towards the top, so the room is not a flat colour.
        const lift = 1 + direction[1] * 0.35;
        let r = BASE[0] * lift;
        let g = BASE[1] * lift;
        let b = BASE[2] * lift;

        for (const panel of panels) {
          const facing = dot(direction, panel.centre);
          if (facing <= 0.05) continue;
          const sideways = Math.abs(dot(direction, panel.right) / facing) / panel.tanW;
          const upwards = Math.abs(dot(direction, panel.up) / facing) / panel.tanH;
          const edge = Math.max(sideways, upwards);
          if (edge >= 1.08) continue;
          const amount = (edge <= 0.92 ? 1 : (1.08 - edge) / 0.16) * panel.strength;
          r += (panel.colour[0] - r) * amount;
          g += (panel.colour[1] - g) * amount;
          b += (panel.colour[2] - b) * amount;
        }

        const i = (y * FACE_SIZE + x) * 4;
        image.data[i] = Math.min(255, r);
        image.data[i + 1] = Math.min(255, g);
        image.data[i + 2] = Math.min(255, b);
        image.data[i + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
    faces.push(canvas);
  }

  const cube = new CubeTexture(faces);
  cube.colorSpace = SRGBColorSpace;
  cube.needsUpdate = true;
  return cube;
}
