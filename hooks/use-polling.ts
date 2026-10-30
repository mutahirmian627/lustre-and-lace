"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `callback` every `intervalMs` while `enabled`, pausing while the tab
 * is hidden and catching up as soon as it's visible again. The next tick is
 * scheduled only after the previous one finishes, so a slow response never
 * stacks up overlapping requests.
 */
export function usePolling(callback: () => void | Promise<void>, intervalMs: number, enabled = true) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      if (cancelled) return;
      if (!document.hidden) {
        try {
          await callbackRef.current();
        } catch {
          // A failed poll just waits for the next one.
        }
      }
      if (!cancelled) timer = setTimeout(tick, intervalMs);
    }

    function handleVisibility() {
      if (!document.hidden) {
        clearTimeout(timer);
        void tick();
      }
    }

    void tick();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs, enabled]);
}
