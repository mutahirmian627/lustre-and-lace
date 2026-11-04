"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Gem } from "@/features/immersive/stage/Gem";
import { GEM_ANCHOR_ID } from "@/features/immersive/constants";
import type { Tier } from "@/features/immersive/lib/tiers";

interface StageCanvasProps {
  tier: Exclude<Tier, "static">;
  /** False pauses rendering entirely (scrolled away, or the tab is hidden). */
  active: boolean;
  poster: boolean;
  onReady: () => void;
  /** The scene could not keep its frame rate: ask for a cheaper tier. */
  onDecline: () => void;
}

export default function StageCanvas({ tier, active, poster, onReady, onDecline }: StageCanvasProps) {
  const full = tier === "full";

  return (
    <Canvas
      aria-hidden="true"
      frameloop={active ? "always" : "never"}
      dpr={full ? [1, 1.75] : [1, 1.5]}
      gl={{
        // Antialiasing stays on even for the lite tier: without it the gem's edges look jagged on phone
        // screens, which spoils the one thing the page is showing off. The saving is in resolution and lighting.
        antialias: true,
        alpha: true,
        stencil: false,
        powerPreference: full ? "high-performance" : "default",
      }}
      camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 40 }}
      style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        {/* A few real lights for the highlights; the colourful reflections come from the painted cube in Gem. */}
        <ambientLight intensity={0.95} color="#ffd9e6" />
        <directionalLight position={[-3, 4, 5]} intensity={2.4} color="#fff1e2" />
        <pointLight position={[4, 0.5, 3]} intensity={40} color="#f4789f" />
        <Gem anchorId={GEM_ANCHOR_ID} poster={poster} onReady={onReady} />
      </Suspense>
      {!poster && <PerformanceMonitor flipflops={2} onDecline={onDecline} />}
    </Canvas>
  );
}
