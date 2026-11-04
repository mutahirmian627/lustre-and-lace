"use client";

import { useEffect, useRef } from "react";
import { whenNeeded } from "@/features/immersive/lib/when-needed";

/**
 * Drives the page's "atmosphere": a single number, --atmosphere, from 0 (warm paper) to 1 (plum night).
 * Every colour on the page is mixed from it in CSS, so as the first dark section scrolls into view the
 * whole page deepens with it. Scrolling stays native; GSAP's ScrollTrigger only reads the scroll position.
 *
 * GSAP is not needed for the first paint, so it is fetched afterwards (when the browser is idle, or the
 * moment the visitor starts to scroll), keeping it off the page's critical path.
 *
 * For visitors who prefer reduced motion the page does not blend gradually; it switches once.
 */
export function ScrollAtmosphere({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scope.current?.closest<HTMLElement>(".immersive-root");
    const night = scope.current?.querySelector<HTMLElement>("[data-night]");
    if (!root || !night) return;

    let cancelled = false;
    let revert: (() => void) | undefined;

    async function start(root: HTMLElement, night: HTMLElement) {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        ScrollTrigger.create({
          trigger: night,
          start: "top 85%",
          end: "top 25%",
          scrub: true,
          onUpdate: (self) => root.style.setProperty("--atmosphere", self.progress.toFixed(3)),
        });
        return () => root.style.setProperty("--atmosphere", "0");
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        ScrollTrigger.create({
          trigger: night,
          start: "top 60%",
          onToggle: (self) => root.style.setProperty("--atmosphere", self.isActive ? "1" : "0"),
        });
        return () => root.style.setProperty("--atmosphere", "0");
      });

      revert = () => mm.revert();
    }

    const cancelSchedule = whenNeeded(() => {
      void start(root, night);
    });

    return () => {
      cancelled = true;
      cancelSchedule();
      revert?.();
    };
  }, []);

  return <div ref={scope}>{children}</div>;
}
