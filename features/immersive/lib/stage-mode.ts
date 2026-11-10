import { useSyncExternalStore } from "react";
import type { StillReason } from "@/features/immersive/lib/tiers";

/**
 * What the visitor is looking at right now, shared between the loader (which decides) and the parts of the page that
 * depend on it: the pictures-in-motion fallback, and the quiet note offering the 3D back. Kept outside React state so
 * that those parts, which sit in different places on the page, can all read it.
 */
export interface StageMode {
  mode: "loading" | "live" | "still";
  reason: StillReason | null;
}

let state: StageMode = { mode: "loading", reason: null };
const listeners = new Set<() => void>();

export function setStageMode(mode: StageMode["mode"], reason: StillReason | null = null) {
  if (state.mode === mode && state.reason === reason) return;
  state = { mode, reason };
  listeners.forEach((listener) => listener());
}

const server: StageMode = { mode: "loading", reason: null };

export function useStageMode(): StageMode {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => server
  );
}

/** Asks the loader to try the live scene again (set by the loader; called by the note's button). */
let retry: (() => void) | null = null;
export const registerRetry = (fn: (() => void) | null) => {
  retry = fn;
};
export const requestRetry = () => retry?.();
