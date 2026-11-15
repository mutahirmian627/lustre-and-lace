import * as timeline from "../../../features/immersive/lib/timeline";

/**
 * Where things are along the homepage's scroll, taken from the page's own scroll maths (lib/timeline.ts), so these tests keep
 * pointing at the right place when the journey is made longer or shorter. A "scene" is the position the tests scroll to:
 * 0..1 across the opening, then 1 + the share of the rest of the run.
 */
export const OPENING = timeline.RUN.opening;
export const RUN = timeline.RUN.services;

/** The scene at which the camera is `sigma` metres down the hall. */
export const at = (sigma: number) => 1 + timeline.progressForSigma(sigma);

export const SCENES = {
  /** Before the doorway, with the approach line on show. */
  approach: 0.95,
  /** In the services: before the third arch, and before the sixth. */
  services: at(timeline.ARCHES[2] - 1.2),
  laterService: at(timeline.ARCHES[5] - 1.2),
  /** In the corridor, as it nears the large doorway (words: none, page: still plum). */
  threshold: at(66),
  /** Deep in the corridor. */
  corridor: at(40),
  /** The camera stopped in front of stop `i` of the exhibition. */
  work: (i: number) => at(timeline.WORK_STOPS[i]),
  /** The empty arch: the exhibition's last stop. */
  nextExhibit: at(timeline.WORK_END_SIGMA),
  /** The camera stopped before gate `i` of the process. */
  process: (i: number) => at(timeline.PROCESS_STOPS[i]),
  /** In front of the sculpture, with the contact words fully on show. */
  contact: at(timeline.CLOSE_SIGMA),
};

export const WORK_STOPS = timeline.WORK_STOPS;
export const PROCESS_STOPS = timeline.PROCESS_STOPS;
