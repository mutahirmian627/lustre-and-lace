"use client";

import { useEffect, useState } from "react";
import { useDeviceTier, useQueryFlag } from "@/features/immersive/hooks/useDeviceTier";

/**
 * A small readout of what the device was judged capable of, shown only when the address ends in
 * `?debug`. Meant for testing on real phones: open the preview with `?debug` and screenshot the badge.
 * It also shows the live frame rate (the scene publishes it once a second).
 */
export function TierBadge() {
  const show = useQueryFlag("debug");
  const device = useDeviceTier();
  const [fps, setFps] = useState("–");
  const [stage, setStage] = useState("–");

  useEffect(() => {
    if (!show) return;
    const timer = window.setInterval(() => {
      setFps(document.documentElement.dataset.fps ?? "–");
      const root = document.querySelector<HTMLElement>(".immersive-root");
      setStage(`${root?.dataset.stage ?? "–"}${root?.dataset.stageReason ? ` (${root.dataset.stageReason})` : ""}`);
    }, 500);
    return () => window.clearInterval(timer);
  }, [show]);

  if (!show || !device) return null;
  const s = device.signals;

  return (
    <div className="fixed bottom-3 left-3 z-50 max-w-[calc(100vw-1.5rem)] rounded-md bg-black/85 px-3 py-2 font-mono text-[11px] leading-5 text-white">
      <div>
        tier: <strong>{device.tier}</strong> ({device.reason}) · showing: <strong>{stage}</strong> · fps: <strong>{fps}</strong>
      </div>
      <div>
        webgl2 {s.webgl2 ? "yes" : "no"} · cores {s.cores ?? "?"} · memory {s.memoryGb ?? "?"}GB · dpr {s.devicePixelRatio}
      </div>
      <div>
        network {s.effectiveType ?? "?"} ({s.downlink ?? "?"} Mbps) · saveData {s.saveData ? "on" : "off"} · reduced motion {s.reducedMotion ? "on" : "off"}
      </div>
    </div>
  );
}
