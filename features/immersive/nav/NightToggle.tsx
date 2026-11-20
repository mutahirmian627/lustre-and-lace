"use client";

import { useEffect } from "react";
import { setNight, useNight } from "@/features/immersive/lib/night";
import { useStageMode } from "@/features/immersive/lib/stage-mode";

/**
 * "Daylight" / "After dark": the switch between the two times of day. Small and in the bar's own language (a mono pill
 * with a hairline), it shows the time of day you are in, and what it would turn to is its action: a `switch`, so assistive
 * technology announces it as "After dark, on/off". It is only offered while the live scene is running, because the pictures-
 * in-motion fallback (for devices that don't run the 3D) is daylight only.
 */
export function NightToggle() {
  const night = useNight();
  const { mode } = useStageMode();

  // The pictures-in-motion fallback is daylight only: if the scene never runs, the page must not stay dressed for night
  // (dark text on daylight pictures), whatever the early script saw. The saved choice is kept for the next visit.
  useEffect(() => {
    if (mode === "still") setNight(false, { instant: true, save: false });
  }, [mode]);

  if (mode === "still") return null;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      aria-label="After dark"
      className="imm-pill imm-night-toggle"
      data-night-toggle
      onClick={() => setNight(!night)}
    >
      <span className="imm-night-icon" aria-hidden="true" />
      <span className="imm-night-label" aria-hidden="true">
        {night ? "After dark" : "Daylight"}
      </span>
    </button>
  );
}
