"use client";

import { ARCHES, RUN, progressForSigma } from "@/features/immersive/lib/timeline";

/**
 * The 01-07 index under the services: each number takes the visitor to that service. The page's scroll is the camera,
 * so this scrolls to the place where the camera stands just before that service's arch, which is where its words
 * arrive. The camera eases there by itself.
 */
export function ServiceRail({ names }: { names: readonly string[] }) {
  function jumpTo(index: number) {
    const run = document.getElementById("run");
    if (!run) return;
    // The same arithmetic as ScrollDriver: the opening takes its share of the run, the rest is the services run.
    const travel = run.getBoundingClientRect().height - window.innerHeight;
    const openingTravel = (travel * RUN.opening) / (RUN.opening + RUN.services);
    const progress = progressForSigma(ARCHES[index] - 1.2);
    const top = run.getBoundingClientRect().top + window.scrollY + openingTravel + progress * (travel - openingTravel);
    window.scrollTo({ top, behavior: "auto" });
  }

  return (
    <nav aria-label="Jump to a service">
      <ol className="imm-service-rail">
        {names.map((name, i) => (
          <li key={name} data-i={i}>
            <button type="button" className="imm-service-jump" aria-label={`${String(i + 1).padStart(2, "0")}, ${name}`} onClick={() => jumpTo(i)}>
              {String(i + 1).padStart(2, "0")}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
