"use client";

import { useEffect } from "react";
import { onNight, type NightChannels } from "@/features/immersive/lib/night";

/**
 * Follows the change between daylight and after dark from inside a scene component. The function is called straight away
 * (so a component that arrives late, or is rebuilt, starts in the right state) and again whenever the change moves, and it
 * is removed when the component goes. Pass what the function reads (the materials it changes) as `deps`.
 */
export function useOnNight(tween: (channels: NightChannels) => void, deps: readonly unknown[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onNight(tween), deps);
}
