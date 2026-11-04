"use client";

import { useSyncExternalStore } from "react";
import { classifyTier, readTierSignals, type TierResult, type TierSignals } from "@/features/immersive/lib/tiers";

export interface DeviceTier extends TierResult {
  signals: TierSignals;
}

let cached: DeviceTier | null = null;

function getSnapshot(): DeviceTier {
  // Read once and keep it: the answer doesn't change during a visit, and useSyncExternalStore needs a
  // stable object between calls.
  if (!cached) {
    const signals = readTierSignals();
    cached = { ...classifyTier(signals), signals };
  }
  return cached;
}

const subscribe = () => () => {};

/** `null` on the server and during hydration, then the device's tier. */
export function useDeviceTier(): DeviceTier | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** True when the page URL carries `?name` (e.g. `?debug`). False on the server. */
export function useQueryFlag(name: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).has(name),
    () => false
  );
}
