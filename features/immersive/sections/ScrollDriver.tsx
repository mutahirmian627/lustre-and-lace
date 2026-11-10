"use client";

import { useEffect } from "react";
import { stageState } from "@/features/immersive/lib/stage-state";
import {
  CONTACT_SIGMA,
  FLIP_SIGMA,
  RUN,
  SERVICES_END,
  THRESHOLD_END,
  PROCESS_SIGMA,
  WORK_SIGMA,
  hallSigma,
  processIndexFromSigma,
  serviceIndexAt,
  smoothstep,
  workIndexFromSigma,
} from "@/features/immersive/lib/timeline";

/**
 * Turns the page's scroll position into numbers and shares them two ways: as `stageState.target` for the 3D
 * camera, and as CSS variables and data attributes on the page root, which the stylesheet uses to fade text and
 * shift colours. Nothing re-renders; scrolling stays the browser's own.
 *
 *   --p       0..1 across the opening (gallery to hall)
 *   --s       0..1 across the services, the threshold and the ivory hall
 *   --flip    0..1 as the camera passes through the large doorway: the page turns from plum back to ivory
 *   --w       0..1 while the exhibition's words are on show (it fades in as the camera comes inside, out as it turns to the sculpture)
 *   --pr      the same for the process's words, at the gates further down the hall
 *   --c       0..1 as the contact words arrive in the ivory hall
 *   data-process  which of the process's five steps is on show
 *   data-work     which of the exhibition's four stops is on show
 *   data-phase    which text is meant to be readable now: opening, transit, approach, services, contact
 *   data-service  which of the seven services is on show (while in the services phase)
 *
 * `runId` is the tall element whose scrolling drives all of it; the visible stage is pinned inside it. The
 * opening and the services share one run, split by the proportions in `RUN`, so the camera glides on without a seam.
 */
export function ScrollDriver({ runId }: { runId: string }) {
  useEffect(() => {
    const run = document.getElementById(runId);
    const root = run?.closest<HTMLElement>(".immersive-root");
    if (!run || !root) return;

    // In poster mode the stage is posed by the URL instead.
    if (new URLSearchParams(window.location.search).has("poster")) return;

    const openingShare = RUN.opening / (RUN.opening + RUN.services);

    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = run.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const y = travel > 0 ? Math.min(travel, Math.max(0, -rect.top)) : 0;
      const openingTravel = travel * openingShare;
      const p = openingTravel > 0 ? Math.min(1, y / openingTravel) : 0;
      const s = travel > openingTravel ? Math.min(1, Math.max(0, (y - openingTravel) / (travel - openingTravel))) : 0;

      stageState.target = p + s;
      root.style.setProperty("--p", p.toFixed(4));
      root.style.setProperty("--s", s.toFixed(4));

      // Which text is meant to be readable now. The others are hidden from the keyboard and screen readers as well as the eye.
      // (A sliver of the services run still belongs to the approach, so it can fade out before the services fade in.)
      const sigma = hallSigma(s);
      const flip = smoothstep(FLIP_SIGMA[0], FLIP_SIGMA[1], sigma);
      const contact = smoothstep(CONTACT_SIGMA[0], CONTACT_SIGMA[1], sigma);
      root.style.setProperty("--flip", flip.toFixed(4));
      root.style.setProperty("--c", contact.toFixed(4));
      const work = smoothstep(WORK_SIGMA[0], WORK_SIGMA[1], sigma) * (1 - smoothstep(WORK_SIGMA[2], WORK_SIGMA[3], sigma));
      root.style.setProperty("--w", work.toFixed(4));
      const process = smoothstep(PROCESS_SIGMA[0], PROCESS_SIGMA[1], sigma) * (1 - smoothstep(PROCESS_SIGMA[2], PROCESS_SIGMA[3], sigma));
      root.style.setProperty("--pr", process.toFixed(4));

      const phase =
        s > 0.03
          ? s < SERVICES_END
            ? "services"
            : s < THRESHOLD_END
              ? "threshold"
              : contact > 0.02
                ? "contact"
                : sigma >= WORK_SIGMA[3]
                  ? "process"
                  : "work"
          : p < 0.2
            ? "opening"
            : p < 0.56
              ? "transit"
              : "approach";
      if (root.dataset.phase !== phase) root.dataset.phase = phase;

      const service = String(serviceIndexAt(s));
      if (root.dataset.service !== service) root.dataset.service = service;
      const stop = String(Math.max(0, workIndexFromSigma(sigma)));
      if (root.dataset.work !== stop) root.dataset.work = stop;
      const step = String(Math.max(0, processIndexFromSigma(sigma)));
      if (root.dataset.process !== step) root.dataset.process = step;
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
      root.style.removeProperty("--s");
      root.style.removeProperty("--flip");
      root.style.removeProperty("--c");
      root.style.removeProperty("--w");
      root.style.removeProperty("--pr");
      delete root.dataset.phase;
      delete root.dataset.service;
      delete root.dataset.work;
      delete root.dataset.process;
      stageState.target = 0;
    };
  }, [runId]);

  return null;
}
