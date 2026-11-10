"use client";

import { useStageMode } from "@/features/immersive/lib/stage-mode";
import { StillJourney } from "@/features/immersive/sections/StillJourney";

/**
 * What is behind the text until (and unless) the live scene takes over.
 *
 * The opening picture is in the server HTML, so the browser starts fetching it with the page and the first paint
 * already looks like the finished scene (landscape and portrait cuts, chosen by the screen's shape). If the live
 * scene is not running, the whole journey plays here as a sequence of frames rendered from it, driven by scroll and
 * gently moving on its own (see StillJourney).
 */
export function Backdrop() {
  const { mode } = useStageMode();

  return (
    <div className="imm-backdrop" aria-hidden="true">
      <picture className="imm-still imm-still--opening">
        <source media="(max-aspect-ratio: 17/20)" srcSet="/immersive/opening-portrait.webp" />
        <img src="/immersive/opening-landscape.webp" alt="" width={1600} height={900} fetchPriority="high" decoding="async" />
      </picture>
      {mode === "still" && <StillJourney />}
    </div>
  );
}
