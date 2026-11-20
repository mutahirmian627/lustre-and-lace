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
 *
 * After dark each world is painted again, with warm gold strips and softboxes in place of the daylight ones, and the same
 * cube is cross-faded between the two (see createCubeFade): the materials never change, only what they reflect.
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

/**
 * The same room after dark: a midnight-plum void where the daylight was, and the lamps in its place. Hairline strips of
 * warm gold (the cove lights along the walls and the ceiling), a soft warm glow at the far end (the door of light), warm
 * pools near the floor, and one faint cool panel high on the right for the moon. Warm light is the main thing it reflects.
 */
const ROOM_NIGHT: CubeSpec = {
  base: [16, 10, 21],
  lift: 0.35,
  panels: [
    { dir: [0.75, 0.35, 0.3], half: [3, 40], colour: [255, 208, 148], strength: 0.9 },
    { dir: [-0.75, 0.35, 0.3], half: [3, 40], colour: [255, 202, 140], strength: 0.85 },
    { dir: [0, 1, -0.3], half: [4, 50], colour: [255, 200, 135], strength: 0.75 },
    { dir: [0.05, 0.1, -1], half: [14, 16], colour: [255, 190, 125], strength: 0.9, soft: 0.6 },
    { dir: [-0.3, 0.2, 0.9], half: [18, 22], colour: [255, 200, 140], strength: 0.5, soft: 0.5 },
    { dir: [0, -0.85, 0.45], half: [60, 26], colour: [78, 52, 44], strength: 0.65, soft: 0.5 },
    { dir: [0.6, 0.7, -0.2], half: [20, 16], colour: [150, 168, 214], strength: 0.4, soft: 0.6 },
    { dir: [0, 0.25, 0.97], half: [44, 1.5], colour: [255, 214, 160], strength: 0.6 },
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

/**
 * Paints one face of the cube into `data` (RGBA, FACE_SIZE squared). This runs on the main thread, so the inner loop avoids
 * allocating: every pixel works in plain numbers. (An earlier version built small arrays per pixel and took about a third
 * of a second for the whole cube.) The same function paints the daylight world at start-up and the night world later.
 */
function paintFace(spec: CubeSpec, panels: PreparedPanel[], face: number, data: Uint8ClampedArray) {
  const count = panels.length;
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
}

function paintCube(spec: CubeSpec): CubeTexture {
  const panels = preparePanels(spec.panels);
  const faces: HTMLCanvasElement[] = [];

  for (let face = 0; face < 6; face++) {
    const canvas = document.createElement("canvas");
    canvas.width = FACE_SIZE;
    canvas.height = FACE_SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas is not available");
    const image = context.createImageData(FACE_SIZE, FACE_SIZE);
    paintFace(spec, panels, face, image.data);
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

/**
 * What the ribbon sees after dark: almost the same arrangement of strips and softboxes (so it still flashes through
 * dark and bright as it twists, which is what makes chrome look like chrome), but the world is a dark plum void and every
 * light in it is warm gold, with one faint cool strip for the moon. Large areas are deep and reflective; the lights are
 * small and bright, so the ribbon reads as a polished sculpture catching a few lamps in a dark gallery.
 */
const CHROME_NIGHT: CubeSpec = {
  base: [14, 9, 19],
  lift: 0.4,
  panels: [
    { dir: [-0.5, 0.55, 0.7], half: [30, 16], colour: [214, 156, 104], strength: 0.8, soft: 0.5 },
    { dir: [-0.1, -0.35, 0.9], half: [52, 18], colour: [20, 12, 26], strength: 0.9, soft: 0.35 },
    { dir: [0.55, 0.15, 0.8], half: [3, 40], colour: [255, 222, 170], strength: 1 },
    { dir: [-0.82, 0.1, 0.5], half: [3, 42], colour: [255, 208, 150], strength: 0.95 },
    { dir: [0.05, 0.1, -1], half: [62, 42], colour: [18, 11, 24], strength: 0.92, soft: 0.5 },
    { dir: [0.05, 0.1, -1], half: [10, 12], colour: [255, 190, 130], strength: 1, soft: 0.6 },
    { dir: [0.42, 0.05, -0.9], half: [2.5, 40], colour: [255, 224, 176], strength: 1 },
    { dir: [-0.42, 0.05, -0.9], half: [2.5, 40], colour: [255, 214, 160], strength: 0.9 },
    { dir: [0.3, 0.2, -0.9], half: [3, 40], colour: [255, 226, 180], strength: 1 },
    { dir: [0.9, 0.4, 0.2], half: [22, 24], colour: [138, 156, 206], strength: 0.5, soft: 0.5 },
    { dir: [0, 1, 0.1], half: [30, 26], colour: [200, 150, 100], strength: 0.3, soft: 0.5 },
    { dir: [0, 0.28, 0.96], half: [44, 1.6], colour: [8, 5, 12], strength: 1 },
    { dir: [-0.9, 0, -0.3], half: [16, 30], colour: [60, 40, 52], strength: 0.8, soft: 0.4 },
    { dir: [0, -1, 0], half: [70, 40], colour: [28, 18, 34], strength: 0.9, soft: 0.6 },
    { dir: [0, -0.5, 0.8], half: [60, 10], colour: [120, 80, 52], strength: 0.5, soft: 0.5 },
    { dir: [0.85, -0.3, 0], half: [3, 40], colour: [255, 204, 146], strength: 1 },
    { dir: [-0.85, -0.3, 0], half: [3, 40], colour: [255, 204, 146], strength: 1 },
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

/** Which night world a cube cross-fades to. */
export type CubeWorld = "room" | "chrome";
const NIGHT_SPECS: Record<CubeWorld, CubeSpec> = { room: ROOM_NIGHT, chrome: CHROME_NIGHT };

export interface CubeFade {
  /** True once the night world is painted. */
  readonly ready: boolean;
  /** Paints one more face of the night world (call it in idle moments). Returns true when there is nothing left to paint. */
  prepare(): boolean;
  /** Shows the cube at `amount` of the way from its daylight world (0, exactly as painted) to its night world (1). */
  set(amount: number): void;
}

/**
 * Lets one cube texture show either of two worlds, or a blend. The materials that use it never change (no new shaders, no
 * new textures): only the pixels of its six small faces, 96 squared each, are rewritten and re-sent, which costs a fraction
 * of a millisecond. The night world is painted lazily, one face at a time, so start-up pays nothing for it. At 0 the daylight
 * pixels are put back byte for byte, so day is exactly the day that was painted.
 */
export function createCubeFade(cube: CubeTexture, world: CubeWorld): CubeFade {
  const faces = cube.image as HTMLCanvasElement[];
  const contexts = faces.map((canvas) => {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas is not available");
    return context;
  });
  const day = contexts.map((context) => context.getImageData(0, 0, FACE_SIZE, FACE_SIZE));
  const night = contexts.map((context) => context.createImageData(FACE_SIZE, FACE_SIZE));
  const scratch = contexts.map((context) => context.createImageData(FACE_SIZE, FACE_SIZE));
  const spec = NIGHT_SPECS[world];
  const panels = preparePanels(spec.panels);
  let painted = 0;

  const fade: CubeFade = {
    get ready() {
      return painted === 6;
    },
    prepare() {
      if (painted < 6) {
        paintFace(spec, panels, painted, night[painted].data);
        painted += 1;
      }
      return painted === 6;
    },
    set(amount) {
      if (amount > 0) while (!fade.prepare());
      for (let face = 0; face < 6; face++) {
        if (amount <= 0) {
          contexts[face].putImageData(day[face], 0, 0);
        } else if (amount >= 1) {
          contexts[face].putImageData(night[face], 0, 0);
        } else {
          const a = day[face].data;
          const b = night[face].data;
          const out = scratch[face].data;
          for (let i = 0; i < out.length; i++) out[i] = a[i] + (b[i] - a[i]) * amount;
          contexts[face].putImageData(scratch[face], 0, 0);
        }
      }
      cube.needsUpdate = true;
    },
  };
  return fade;
}
