/**
 * Numbers shared between the page (scroll, DOM) and the 3D scene, kept outside React so that scrolling and
 * moving the mouse never cause a re-render.
 */
export const stageState = {
  /**
   * Where the scroll is, in "scenes": 0..1 across the opening (gallery to hall), then 1..2 across the
   * services and the close. Written by the scroll listener.
   */
  target: 0,
  /** The same, eased: what the camera actually uses, so the scene has weight rather than snapping. */
  value: 0,
  /** How far down the corridor the camera is (σ, metres); the opening's end point until the corridor begins. */
  sigma: 7.6,
  /** Where the camera is, in the world (written by the camera rig; the ribbon gives way to it). */
  camera: { x: 0, y: 1.5, z: 7.6 },
  /** How fast the visitor is scrolling, in scenes per second, smoothed. The ribbon ripples faster when it is high. */
  speed: 0,
  /** Frames per second over the last second, for the `?debug` readout. */
  fps: 0,
};

/** Starting time of the ribbon's motion, in seconds. The fallback pictures are rendered at this moment. */
export const POSTER_TIME = 11.5;
