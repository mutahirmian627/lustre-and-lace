"use client";

import { requestRetry, useStageMode } from "@/features/immersive/lib/stage-mode";
import type { StillReason } from "@/features/immersive/lib/tiers";

const WORDS: Record<StillReason, { why: string; action: string | null }> = {
  "no-webgl2": { why: "3D isn't available on this device", action: null },
  "reduced-motion": { why: "Reduced motion is on", action: "Play 3D" },
  "save-data": { why: "Data saver is on", action: "Play 3D" },
  "slow-frames": { why: "3D was running slowly here", action: "Try 3D again" },
  error: { why: "3D didn't start", action: "Try 3D again" },
};

/**
 * A quiet note, only while the visitor is looking at pictures rather than the live scene: it says why, and offers to
 * try the live scene again. The page used to fall back to pictures silently and for good, which on a capable machine
 * looked like a dead page with no explanation. Now it is never silent and never final.
 */
export function StillNote() {
  const { mode, reason } = useStageMode();
  if (mode !== "still" || !reason) return null;
  const words = WORDS[reason];

  return (
    <div className="imm-still-note" data-reason={reason}>
      <span>{words.why}</span>
      {words.action && (
        <button type="button" onClick={requestRetry}>
          {words.action}
        </button>
      )}
    </div>
  );
}
