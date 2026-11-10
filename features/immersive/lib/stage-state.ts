/**
 * Numbers shared between the page (scroll, DOM) and the 3D scene, kept outside React so that scrolling and
 * moving the mouse never cause a re-render.
 */
export const stageState = {
  /** Where the scroll is, 0..1 across the opening sequence. Written by the scroll listener. */
  target: 0,
  /** The same, eased: what the camera actually uses, so the scene has weight rather than snapping. */
  value: 0,
  /** Frames per second over the last second, for the `?debug` readout. */
  fps: 0,
};

/** Starting time of the ribbon's motion, in seconds. The fallback pictures are rendered at this moment. */
export const POSTER_TIME = 11.5;
