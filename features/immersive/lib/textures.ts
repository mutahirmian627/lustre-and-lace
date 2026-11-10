import { CanvasTexture, ClampToEdgeWrapping, LinearFilter, RepeatWrapping, SRGBColorSpace } from "three";

/**
 * Every texture in the installation is drawn in code at start-up. They are tiny (256px tiles), add nothing
 * to the download, and are drawn the same way every time, so the pre-rendered fallback pictures match the live scene.
 */

function canvas(width: number, height: number) {
  const el = document.createElement("canvas");
  el.width = width;
  el.height = height;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  return { el, ctx };
}

/**
 * Floor tiles: glazed ivory squares with a fine seam and a soft bevel along it, one tile per texture repeat.
 * The seams give the floor a scale and make its perspective visible; there is deliberately no speckle or
 * cloudy mottling, which at a distance aliases into a visible mesh. Tiles seamlessly. Colour space sRGB.
 */
export function createTileTexture(): CanvasTexture {
  const size = 256;
  const { el, ctx } = canvas(size, size);
  ctx.fillStyle = "#efe7da";
  ctx.fillRect(0, 0, size, size);

  // A softly lit face: slightly lighter in the middle of the tile than at its edges.
  const face = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.72);
  face.addColorStop(0, "rgba(255,252,244,0.4)");
  face.addColorStop(1, "rgba(255,252,244,0)");
  ctx.fillStyle = face;
  ctx.fillRect(0, 0, size, size);

  // The seam (drawn on the tile's edge, so neighbouring tiles join it) and a bevel just inside it.
  ctx.strokeStyle = "rgba(112,92,84,0.34)";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  const texture = new CanvasTexture(el);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

/**
 * The lattice, as a mask: white where there is a frosted-glass bar, black where light passes straight
 * through. One tile holds one repeat of the pattern: a square grid, a diamond joining the midpoints of its
 * sides, and a ring at the centre. It is a quiet, contemporary reading of a jali screen: the geometry
 * without the ornament. Tiles seamlessly.
 */
export function createJaliMask(): CanvasTexture {
  const size = 256;
  const { el, ctx } = canvas(size, size);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const half = size / 2;
  for (const ox of [-size, 0, size]) {
    for (const oy of [-size, 0, size]) {
      ctx.save();
      ctx.translate(ox, oy);

      // The square grid (its lines sit on the tile edge, so neighbouring tiles join).
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.rect(0, 0, size, size);
      ctx.stroke();

      // The diamond between the midpoints of the four sides.
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(half, 0);
      ctx.lineTo(size, half);
      ctx.lineTo(half, size);
      ctx.lineTo(0, half);
      ctx.closePath();
      ctx.stroke();

      // The ring at the centre.
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(half, half, 40, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  const texture = new CanvasTexture(el);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/** A soft round glow: white in the centre fading to nothing. For light spilling and dust. */
export function createGlowTexture(): CanvasTexture {
  const size = 128;
  const { el, ctx } = canvas(size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(el);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
  return texture;
}

/** A band that is solid in the middle and fades at both long edges: the soft edge of a shadow. */
export function createSoftBandTexture(): CanvasTexture {
  const { el, ctx } = canvas(64, 4);
  const gradient = ctx.createLinearGradient(0, 0, 64, 0);
  gradient.addColorStop(0, "#000");
  gradient.addColorStop(0.5, "#fff");
  gradient.addColorStop(1, "#000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 4);
  const texture = new CanvasTexture(el);
  texture.magFilter = LinearFilter;
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
  return texture;
}

/** A soft shade that is darkest at the bottom edge and fades to nothing at the top: the occlusion where a wall meets the floor. */
export function createContactShadeTexture(): CanvasTexture {
  const { el, ctx } = canvas(4, 128);
  const gradient = ctx.createLinearGradient(0, 128, 0, 0);
  gradient.addColorStop(0, "rgba(62,42,60,0.2)");
  gradient.addColorStop(0.35, "rgba(62,42,60,0.06)");
  gradient.addColorStop(1, "rgba(62,42,60,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 128);
  const texture = new CanvasTexture(el);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
  return texture;
}
