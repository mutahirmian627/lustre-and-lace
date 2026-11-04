"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Drives the page's "atmosphere": a single number, --atmosphere, from 0 (warm paper) to 1 (plum night).
 * Every colour on the page is mixed from it in CSS, so as the first dark section scrolls into view the
 * whole page deepens with it. Scrolling stays native; ScrollTrigger only reads the scroll position.
 *
 * For visitors who prefer reduced motion the page does not blend gradually; it switches once.
 */
export function ScrollAtmosphere({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current?.closest<HTMLElement>(".immersive-root");
      const night = scope.current?.querySelector<HTMLElement>("[data-night]");
      if (!root || !night) return;

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
    },
    { scope }
  );

  return <div ref={scope}>{children}</div>;
}
