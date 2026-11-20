/**
 * The two looks, side by side. Day is the scene exactly as it was built (these values were literals in Experience.tsx and
 * the scene's components, and moving them here changes nothing). Night is the same hall after dark: deep midnight plum and
 * warm near-black surfaces, a few warm champagne-gold lights doing the work the sun did, and a very faint cool moonlight.
 *
 * Colours are written as hex strings and mixed in three.js Color space by the consumers, so mid-transition values are
 * ordinary blends of the two.
 */

export const DAY = {
  /** The room's colour, which is also the background and the fog. */
  ivory: "#f1ebdf",
  fog: { near: 18, far: 52 },
  ambient: { intensity: 1.9, color: "#fffdfa" },
  /** The warm daylight from the upper left. */
  sun: { position: [-4, 7, 6] as const, intensity: 2.2, color: "#fff9f0" },
  /** The cool bounce from the right; at night it becomes the moon. */
  fill: { position: [7, 3, 2] as const, intensity: 0.65, color: "#cfc2e8" },
} as const;

export const NIGHT = {
  /** Deep midnight plum, never pure black. */
  room: "#0e0712",
  fog: { near: 6, far: 36 },
  /** Just enough ambient that the architecture never disappears: a dim, warm-grey plum. */
  ambient: { intensity: 0.42, color: "#665078" },
  /** A hint of the sun's direction stays as a very low warm key, so forms keep a gentle gradient. */
  sun: { intensity: 0.0, color: "#ffd9a8" },
  /** Moonlight: cool, restrained, from the upper right. The warm lamps stay the main light. */
  moon: { position: [6, 8, -2] as const, intensity: 0.5, color: "#aebcdf" },
  /** The lamps' colour, close to 2500 K candle-gold: warm champagne, not orange. */
  lamp: "#ffc98c",
  /** The fixtures' glass and the halo round them. */
  fixtureCore: "#fff2d8",
  fixtureHalo: "#ffb766",
} as const;
