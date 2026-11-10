"use client";

import { useDeviceTier } from "@/features/immersive/hooks/useDeviceTier";

/**
 * Pre-rendered pictures of the installation, made by rendering the real scene (see
 * scripts/render-immersive-poster.mjs). The opening picture is in the server HTML, so the browser starts
 * fetching it with the page and the first paint already looks like the finished scene. Each exists in a
 * landscape and a portrait cut, chosen by the screen's shape.
 *
 * The second picture, of the hall, is only fetched on devices that will never get the live scene
 * (reduced motion, weak or data-saving devices); for them the two pictures crossfade as the page scrolls.
 */
export function Backdrop() {
  const device = useDeviceTier();
  const showHall = device?.tier === "static";

  return (
    <div className="imm-backdrop" aria-hidden="true">
      <picture className="imm-still imm-still--opening">
        <source media="(max-aspect-ratio: 17/20)" srcSet="/immersive/opening-portrait.webp" />
        <img src="/immersive/opening-landscape.webp" alt="" width={1600} height={900} fetchPriority="high" decoding="async" />
      </picture>
      {showHall && (
        <picture className="imm-still imm-still--hall">
          <source media="(max-aspect-ratio: 17/20)" srcSet="/immersive/hall-portrait.webp" />
          <img src="/immersive/hall-landscape.webp" alt="" width={1600} height={900} decoding="async" />
        </picture>
      )}
    </div>
  );
}
