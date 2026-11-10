"use client";

import { useEffect } from "react";
import { stageState } from "@/features/immersive/lib/stage-state";

/**
 * Turns the page's scroll position into one number, 0..1 across the opening sequence, and shares it two
 * ways: as `stageState.target` for the 3D camera, and as the CSS variable `--p` on the page root, which
 * the stylesheet uses to fade the text and shift the page's colours. Nothing re-renders; scrolling stays
 * the browser's own.
 *
 * `runId` is the tall element whose scrolling drives the sequence; the visible stage is pinned inside it.
 */
export function ScrollDriver({ runId }: { runId: string }) {
  useEffect(() => {
    const run = document.getElementById(runId);
    const root = run?.closest<HTMLElement>(".immersive-root");
    if (!run || !root) return;

    // In poster mode the stage is posed by the URL instead.
    if (new URLSearchParams(window.location.search).has("poster")) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = run.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      stageState.target = p;
      root.style.setProperty("--p", p.toFixed(4));
      // Which text is meant to be readable now. The others are hidden from the keyboard and screen readers as well as the eye.
      const phase = p < 0.2 ? "opening" : p < 0.56 ? "transit" : "approach";
      if (root.dataset.phase !== phase) root.dataset.phase = phase;
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure(); // pick up a restored scroll position on reload
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
      root.style.removeProperty("--p");
      delete root.dataset.phase;
      stageState.target = 0;
    };
  }, [runId]);

  return null;
}
