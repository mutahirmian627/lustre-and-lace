"use client";

import { useDeviceTier, useQueryFlag } from "@/features/immersive/hooks/useDeviceTier";

/**
 * A small readout of what the device was judged capable of, shown only when the address ends in
 * `?debug`. Meant for testing on real phones: open the preview with `?debug` and screenshot the badge.
 */
export function TierBadge() {
  const show = useQueryFlag("debug");
  const device = useDeviceTier();
  if (!show || !device) return null;
  const s = device.signals;

  return (
    <div className="fixed bottom-3 left-3 z-50 max-w-[calc(100vw-1.5rem)] rounded-md bg-black/85 px-3 py-2 font-mono text-[11px] leading-5 text-white">
      <div>
        tier: <strong>{device.tier}</strong> ({device.reason})
      </div>
      <div>
        webgl2 {s.webgl2 ? "yes" : "no"} · cores {s.cores ?? "?"} · memory {s.memoryGb ?? "?"}GB · dpr {s.devicePixelRatio}
      </div>
      <div>
        network {s.effectiveType ?? "?"} · saveData {s.saveData ? "on" : "off"} · reduced motion {s.reducedMotion ? "on" : "off"}
      </div>
    </div>
  );
}
