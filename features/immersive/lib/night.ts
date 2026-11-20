import { useSyncExternalStore } from "react";

/**
 * "After dark": the same architectural world at a different time of day.
 *
 * One number, `nightState.value` (0 = daylight, 1 = after dark), moves between the two over a few seconds. Everything that
 * changes between day and night follows it, each on its own schedule (`nightChannels`), so the change unfolds in the order a
 * visitor would expect: the daylight fades, the glow thins, the hall darkens, the lamps come on, the moon arrives, and the
 * reflections settle. The numbers live outside React (like stageState), so a transition never causes a re-render.
 *
 * Day is the reference: at value 0 every channel is exactly 0 or 1 and every consumer restores its stored day value, so the
 * daytime scene is the scene it always was.
 */

export const NIGHT_KEY = "aperionie-after-dark";
/** How long the change takes, in seconds (almost nothing for visitors who ask for reduced motion). */
export const NIGHT_SECONDS = 2.6;
const REDUCED_SECONDS = 0.2;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** One channel per part of the change, each 0 (as in daylight) to 1 (fully after dark), or the reverse where named. */
export interface NightChannels {
  /** The overall amount, 0..1. */
  n: number;
  /** The sun and the broad ambient light: 1 in daylight, fading to 0. Goes first. */
  daylight: number;
  /** The soft glow that fills the air and spills from windows and doorways (the additive light sprites): 1 down to 0. */
  glow: number;
  /** How dark the architecture and its air have become (background, fog, ambient floor): 0 up to 1. */
  dark: number;
  /** The decorative lights and the real lamps: 0 up to 1. They come on once the hall has begun to darken. */
  fixtures: number;
  /** The faint cool light entering the hall: 0 up to 1. It arrives last. */
  moon: number;
  /** The reflections (the painted worlds the chrome, lacquer and ceramic reflect): 0 up to 1. */
  reflections: number;
  /** The page's own colours (text, bar, scrims): 0 up to 1, in step with the hall darkening. */
  ui: number;
}

/**
 * The schedule. Edges are fractions of the whole change; the order follows the brief: daylight fades first, the glow thins,
 * the hall darkens, the lights come up, the moon enters, the reflections settle.
 */
export function nightChannels(n: number): NightChannels {
  const value = Math.min(1, Math.max(0, n));
  return {
    n: value,
    daylight: 1 - smoothstep(0, 0.5, value),
    glow: 1 - smoothstep(0.05, 0.6, value),
    dark: smoothstep(0.1, 0.65, value),
    fixtures: smoothstep(0.3, 0.92, value),
    moon: smoothstep(0.5, 1, value),
    reflections: smoothstep(0.3, 0.95, value),
    ui: smoothstep(0.1, 0.7, value),
  };
}

// ---- the shared state ---------------------------------------------------------------------------------------

export const nightState = {
  /** Where it is going: 0 daylight, 1 after dark. */
  target: 0 as 0 | 1,
  /** Where it is now, 0..1. */
  value: 0,
  /** Seconds a full change takes. */
  seconds: NIGHT_SECONDS,
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Moves the value towards the target by `dt` seconds. Returns true if it moved. */
export function stepNight(dt: number): boolean {
  if (nightState.value === nightState.target) return false;
  const step = dt / nightState.seconds;
  nightState.value =
    nightState.target > nightState.value ? Math.min(nightState.target, nightState.value + step) : Math.max(nightState.target, nightState.value - step);
  return true;
}

/** Saved choice (this browser only). Never throws: private windows and blocked storage just mean "daylight". */
export function readSavedNight(): boolean {
  try {
    return window.localStorage.getItem(NIGHT_KEY) === "1";
  } catch {
    return false;
  }
}

function saveNight(on: boolean) {
  try {
    window.localStorage.setItem(NIGHT_KEY, on ? "1" : "0");
  } catch {
    // The choice then lasts until the page is closed.
  }
}

/** Starting state when the page loads: the URL (?night=1 or ?night=0) first, then what the visitor chose last time. */
export function initialNight(search: string): boolean {
  const asked = new URLSearchParams(search).get("night");
  if (asked === "1") return true;
  if (asked === "0") return false;
  return readSavedNight();
}

/**
 * Asks for daylight or after dark. `instant` skips the transition (the first state on loading, and the still pictures).
 * The change reaches the page's styles through `data-night` on the root (the stylesheet's own colours follow the
 * scene's `--dark`, set frame by frame by the 3D scene while it is live and set outright otherwise).
 */
export function setNight(on: boolean, options: { instant?: boolean; save?: boolean } = {}) {
  const { instant = false, save = true } = options;
  const target = on ? 1 : 0;
  nightState.seconds = reducedMotion() ? REDUCED_SECONDS : NIGHT_SECONDS;
  nightState.target = target;
  if (instant) nightState.value = target;
  if (save) saveNight(on);
  if (typeof document !== "undefined") {
    const root = document.querySelector<HTMLElement>(".immersive-root");
    if (root) {
      root.dataset.night = on ? "1" : "0";
      // The stylesheet answers `data-night` by itself (the colours simply switch), which is all a page without the live scene
      // needs. While the scene is live it drives `--dark` frame by frame instead (see NightDirector), for the gradual change.
      if (instant) root.style.setProperty("--dark", String(target));
    }
  }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Whether after dark is on (or on its way): for the toggle. */
export function useNight(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => nightState.target === 1,
    () => false
  );
}

// ---- consumers that follow the change ------------------------------------------------------------------------

type Tween = (channels: NightChannels) => void;
const tweens = new Set<Tween>();

/**
 * Registers something that follows the change (a material, a light, a sprite). It is called with the current channels
 * straight away (so a late arrival starts in the right state) and again on every frame the change moves. Returns the
 * function that unregisters it.
 */
export function onNight(tween: Tween): () => void {
  tweens.add(tween);
  tween(nightChannels(nightState.value));
  return () => {
    tweens.delete(tween);
  };
}

/** Called by the scene's director, once per frame while the value moves (and once more at rest). */
export function applyNight(channels: NightChannels) {
  tweens.forEach((tween) => tween(channels));
}

/** Linear mix, exact at both ends (a + (b - a) * 0 is a; at 1 it is b to within rounding, which no consumer relies on). */
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
