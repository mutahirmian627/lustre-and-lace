import { CubeTexture, SRGBColorSpace } from "three";

/**
 * The reflections every shiny surface in the installation sees: a small "photo studio" painted in code,
 * as the six faces of a cube.
 *
 * Why not use the usual environment helper? It converts an environment into a blurred, multi-level
 * reflection map on the graphics card, and compiling the shaders for that step froze the page for
 * over two seconds on a typical Windows laptop. Mirror chrome and lacquer don't need that blur. A plain
 * cube texture read directly by a simple material costs almost nothing to compile.
 *
 * Each light is a panel at a direction around the object, with a size (in degrees) and a colour. A pixel
 * lights up where its direction falls inside a panel; edges are slightly soft. Values are stored in
 * 8 bits, so "brighter than white" comes from the material's reflectivity, not from here.
 */

const FACE_SIZE = 96;

type Vec3 = [number, number, number];

interface Panel {
  /** Where the light sits, as a direction from the object (x right, y up, z towards the viewer). */
  dir: Vec3;
  /** Half-width and half-height in degrees, as seen from the object. */
  half: [number, number];
  colour: Vec3;
  strength: number;
  /** How far the edge fades, as a fraction of the panel's size: small for a hard strip, large for a soft box. */
  soft?: number;
}

interface CubeSpec {
  /** The colour of the room where no light panel reaches. */
  base: Vec3;
  /** How much brighter the top of the room is than the bottom (0 = flat). */
  lift: number;
  panels: Panel[];
}

/**
 * One light-world for the whole installation, so that the chrome ribbon, the lacquer and the ceramic all
 * agree: bright ivory softboxes and hairline strips from the gallery side (towards the viewer), cool
 * lavender from the right, and a rose-gold glow from the far end of the hall (away from the viewer).
 * The ribbon twists through all of them, which is what makes it read as polished metal.
 */
const ROOM: CubeSpec = {
  base: [52, 32, 58],
  lift: 0.4,
  panels: [
    // The big soft key light: upper left, towards the viewer.
    { dir: [-0.5, 0.55, 0.7], half: [38, 22], colour: [255, 247, 235], strength: 1, soft: 0.5 },
    // Two hairline strip lights either side: a chrome edge flashes when it turns to face one.
    { dir: [0.55, 0.15, 0.8], half: [4.5, 40], colour: [255, 255, 255], strength: 1 },
    { dir: [-0.82, 0.1, 0.5], half: [4, 42], colour: [255, 255, 255], strength: 0.92 },
    // Overhead panel.
    { dir: [0, 1, 0.1], half: [30, 26], colour: [255, 250, 242], strength: 0.95, soft: 0.5 },
    // Cool lavender fill, high on the right.
    { dir: [0.9, 0.4, 0.2], half: [22, 24], colour: [184, 170, 203], strength: 0.9, soft: 0.5 },
    // The rose-gold glow at the far end of the hall (behind the viewer's gaze).
    { dir: [0.05, 0.1, -1], half: [15, 17], colour: [233, 162, 160], strength: 1, soft: 0.6 },
    // Warm floor bounce.
    { dir: [0, -0.85, 0.45], half: [60, 26], colour: [206, 188, 170], strength: 0.72, soft: 0.5 },
    // A thin horizon line of light, level with the eye.
    { dir: [0, 0.25, 0.97], half: [44, 2], colour: [255, 255, 255], strength: 1 },
    // Dusty rose accent on the left.
    { dir: [-0.9, 0, -0.3], half: [14, 30], colour: [211, 165, 176], strength: 0.85, soft: 0.4 },
    // A bright strip behind-right, for edge highlights on the way into the hall.
    { dir: [0.7, 0.2, -0.7], half: [3, 34], colour: [255, 255, 255], strength: 0.9 },
  ],
};

const normalise = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** A panel with everything the per-pixel loop needs as plain numbers: its centre, its two sideways axes and its size. */
interface PreparedPanel {
  cx: number; cy: number; cz: number;
  rx: number; ry: number; rz: number;
  ux: number; uy: number; uz: number;
  tanW: number; tanH: number;
  r: number; g: number; b: number;
  strength: number;
  soft: number;
}

function preparePanels(panels: Panel[]): PreparedPanel[] {
  return panels.map((panel) => {
    const centre = normalise(panel.dir);
    const reference: Vec3 = Math.abs(centre[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const right = normalise(cross(reference, centre));
    const up = cross(centre, right);
    return {
      cx: centre[0], cy: centre[1], cz: centre[2],
      rx: right[0], ry: right[1], rz: right[2],
      ux: up[0], uy: up[1], uz: up[2],
      tanW: Math.tan((panel.half[0] * Math.PI) / 180),
      tanH: Math.tan((panel.half[1] * Math.PI) / 180),
      r: panel.colour[0], g: panel.colour[1], b: panel.colour[2],
      strength: panel.strength,
      soft: panel.soft ?? 0.08,
    };
  });
}

function paintCube(spec: CubeSpec): CubeTexture {
  const panels = preparePanels(spec.panels);
  const faces: HTMLCanvasElement[] = [];
  const count = panels.length;

  // This runs once on the main thread at start-up, so the inner loop avoids allocating: every pixel works in
  // plain numbers. (An earlier version built small arrays per pixel and took about a third of a second.)
  for (let face = 0; face < 6; face++) {
    const canvas = document.createElement("canvas");
    canvas.width = FACE_SIZE;
    canvas.height = FACE_SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas is not available");
    const image = context.createImageData(FACE_SIZE, FACE_SIZE);
    const data = image.data;

    for (let y = 0; y < FACE_SIZE; y++) {
      const v = ((y + 0.5) / FACE_SIZE) * 2 - 1;
      for (let x = 0; x < FACE_SIZE; x++) {
        const u = ((x + 0.5) / FACE_SIZE) * 2 - 1;

        // The direction this pixel looks towards (see the face layout below), normalised.
        let dx: number, dy: number, dz: number;
        switch (face) {
          case 0: dx = 1; dy = -v; dz = -u; break; //   +x
          case 1: dx = -1; dy = -v; dz = u; break; //   -x
          case 2: dx = u; dy = 1; dz = v; break; //     +y
          case 3: dx = u; dy = -1; dz = -v; break; //   -y
          case 4: dx = u; dy = -v; dz = 1; break; //    +z
          default: dx = -u; dy = -v; dz = -1; break; // -z
        }
        const inverse = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz);
        dx *= inverse;
        dy *= inverse;
        dz *= inverse;

        const lift = 1 + dy * spec.lift;
        let r = spec.base[0] * lift;
        let g = spec.base[1] * lift;
        let b = spec.base[2] * lift;

        for (let k = 0; k < count; k++) {
          const panel = panels[k];
          const facing = dx * panel.cx + dy * panel.cy + dz * panel.cz;
          if (facing <= 0.05) continue;
          const sideways = Math.abs(dx * panel.rx + dy * panel.ry + dz * panel.rz) / facing / panel.tanW;
          const upwards = Math.abs(dx * panel.ux + dy * panel.uy + dz * panel.uz) / facing / panel.tanH;
          const edge = sideways > upwards ? sideways : upwards;
          if (edge >= 1 + panel.soft) continue;
          const amount = (edge <= 1 - panel.soft ? 1 : (1 + panel.soft - edge) / (2 * panel.soft)) * panel.strength;
          r += (panel.r - r) * amount;
          g += (panel.g - g) * amount;
          b += (panel.b - b) * amount;
        }

        const i = (y * FACE_SIZE + x) * 4;
        data[i] = r > 255 ? 255 : r;
        data[i + 1] = g > 255 ? 255 : g;
        data[i + 2] = b > 255 ? 255 : b;
        data[i + 3] = 255;
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

/**
 * What the chrome ribbon sees. Polished metal looks like metal because of contrast: broad bright areas
 * next to dark bands and hairlines. So its world is lighter overall than the room's (silvery lavender),
 * with ivory softboxes, a dark floor band, and a few thin lines of dark and light for it to flash through.
 */
const CHROME: CubeSpec = {
  base: [146, 130, 156],
  lift: 0.5,
  panels: [
    { dir: [-0.5, 0.55, 0.7], half: [40, 24], colour: [255, 250, 242], strength: 1, soft: 0.5 },
    { dir: [-0.1, -0.35, 0.9], half: [52, 18], colour: [40, 26, 50], strength: 0.88, soft: 0.35 },
    { dir: [0.55, 0.15, 0.8], half: [3.5, 40], colour: [255, 255, 255], strength: 1 },
    { dir: [-0.82, 0.1, 0.5], half: [3, 42], colour: [255, 255, 255], strength: 0.95 },
    // Looking down the hall: a dark plum far wall with a small warm light, a lavender horizon, and two
    // bright strips either side of the axis, so a ribbon seen head-on still shades from dark to bright.
    { dir: [0.05, 0.1, -1], half: [62, 42], colour: [36, 22, 46], strength: 0.92, soft: 0.5 },
    { dir: [0, 0.02, -1], half: [60, 6], colour: [170, 150, 200], strength: 0.9, soft: 0.5 },
    { dir: [0.05, 0.1, -1], half: [10, 12], colour: [236, 176, 170], strength: 1, soft: 0.6 },
    { dir: [0.42, 0.05, -0.9], half: [2.5, 40], colour: [255, 255, 255], strength: 1 },
    { dir: [-0.42, 0.05, -0.9], half: [2.5, 40], colour: [255, 255, 255], strength: 0.9 },
    { dir: [0.3, 0.2, -0.9], half: [3, 40], colour: [255, 255, 255], strength: 1 },
    { dir: [0.9, -0.1, 0.3], half: [20, 40], colour: [44, 30, 62], strength: 0.85, soft: 0.4 },
    { dir: [0, 1, 0.1], half: [30, 26], colour: [255, 250, 242], strength: 0.95, soft: 0.5 },
    { dir: [0, 0.28, 0.96], half: [44, 1.6], colour: [22, 14, 30], strength: 1 },
    { dir: [-0.9, 0, -0.3], half: [16, 30], colour: [170, 150, 196], strength: 0.85, soft: 0.4 },
    // Looking along the hall from underneath: a dark floor, framed by two bright strips low on either side.
    { dir: [0, -1, 0], half: [70, 40], colour: [48, 32, 62], strength: 0.9, soft: 0.6 },
    { dir: [0, -0.5, 0.8], half: [60, 10], colour: [150, 130, 182], strength: 0.9, soft: 0.5 },
    { dir: [0.85, -0.3, 0], half: [3, 40], colour: [255, 255, 255], strength: 1 },
    { dir: [-0.85, -0.3, 0], half: [3, 40], colour: [255, 255, 255], strength: 1 },
  ],
};

/** The room's reflection world (ceramic, lacquer, glass). Browser only: it paints onto canvases. */
export function createRoomCube(): CubeTexture {
  return paintCube(ROOM);
}

/** The chrome's reflection world. Browser only. */
export function createChromeCube(): CubeTexture {
  return paintCube(CHROME);
}
