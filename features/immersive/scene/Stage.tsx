"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Experience } from "@/features/immersive/scene/Experience";
import type { Tier } from "@/features/immersive/lib/tiers";

interface StageProps {
  tier: Exclude<Tier, "static">;
  /** False pauses drawing entirely (menu open, or the tab is in the background). */
  active: boolean;
  /** Render a motionless still, for making the fallback pictures. */
  frozen: boolean;
  onCompiled: () => void;
  onReady: () => void;
  /** The scene could not keep its frame rate: ask for a cheaper tier. */
  onDecline: () => void;
  /** The graphics context was lost (the driver reset, or the browser reclaimed it). */
  onLost: () => void;
}

/**
 * The scene steps itself down only if it is genuinely struggling: it starts watching its own frame rate a few
 * seconds after the first frame (start-up work such as hydration and shader compilation is not a verdict on
 * the device), and "struggling" means under 30 fps, not merely under the display's 60.
 */
const WATCH_AFTER_MS = 4000;
/** The full scene steps down below 30 fps. The lighter one is only given up (for pictures) below 18, which is very slow. */
const FULL_BOUNDS = () => [30, 120] as [number, number];
const LITE_BOUNDS = () => [18, 120] as [number, number];

export default function Stage({ tier, active, frozen, onCompiled, onReady, onDecline, onLost }: StageProps) {
  const lite = tier === "lite";
  const [watching, setWatching] = useState(false);
  const [drawn, setDrawn] = useState(false);

  const handleReady = useCallback(() => {
    setDrawn(true);
    onReady();
  }, [onReady]);

  useEffect(() => {
    if (!drawn || frozen) return;
    const timer = window.setTimeout(() => setWatching(true), WATCH_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [drawn, frozen]);

  return (
    <Canvas
      aria-hidden="true"
      // No tone mapping: the colours in the scene are the colours on screen, which keeps the ivory ivory
      // and makes the fallback pictures match.
      flat
      frameloop={active ? "always" : "never"}
      dpr={frozen ? 1 : lite ? [1, 1.5] : [1, 1.75]}
      gl={{
        // Antialiasing stays on for every tier: the arches' edges and the lattice are the whole look, and
        // jagged edges on a phone would spoil them. The saving is in resolution and in what is drawn.
        antialias: true,
        alpha: false,
        stencil: false,
        powerPreference: lite ? "default" : "high-performance",
        preserveDrawingBuffer: frozen,
      }}
      onCreated={({ gl }) => {
        // A lost context leaves a blank canvas; hand the visitor the pictures (and the way back) instead.
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onLost();
        });
      }}
      camera={{ position: [0.1, 1.5, 7.6], fov: 32, near: 0.1, far: 90 }}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Experience lite={lite} frozen={frozen} onCompiled={onCompiled} onReady={handleReady} />
      </Suspense>
      {watching && <PerformanceMonitor bounds={lite ? LITE_BOUNDS : FULL_BOUNDS} flipflops={3} onDecline={onDecline} />}
    </Canvas>
  );
}
