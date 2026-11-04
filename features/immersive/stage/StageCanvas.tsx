"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
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

/**
 * The lighting. Instead of downloading an environment photo (which would be a file to host, license and
 * wait for), the "studio" is built from a few glowing panels: a warm key light, a raspberry rim from
 * the right and a gold kicker from below. They are baked into reflections once, then reused every frame.
 */
function StudioLight({ resolution }: { resolution: number }) {
  return (
    <Environment resolution={resolution} frames={1}>
      {/* A dim plum room, so facets that face no light still read as plum rather than black. */}
      <color attach="background" args={["#3b2631"]} />
      {/* Big soft key from the upper left, a raspberry rim on the right, a gold kicker from below. */}
      <Lightformer form="rect" intensity={5} color="#fff1e2" position={[-4, 3, 3]} scale={[6, 3, 1]} rotation-y={Math.PI / 5} />
      <Lightformer form="rect" intensity={4} color="#f08fb0" position={[5, 0.5, 2]} scale={[3.5, 6, 1]} rotation-y={-Math.PI / 3} />
      <Lightformer form="ring" intensity={3} color="#d4b073" position={[0, -4, 2]} scale={4} rotation-x={Math.PI / 2.4} />
      <Lightformer form="circle" intensity={2} color="#ffffff" position={[0, 5, -3]} scale={3} />
      {/* Thin bright strips: each facet that turns to face one flashes, which is what reads as sparkle. */}
      <Lightformer form="rect" intensity={9} color="#ffffff" position={[-2.5, 0.5, 4]} scale={[0.35, 5, 1]} rotation-y={Math.PI / 8} />
      <Lightformer form="rect" intensity={8} color="#ffd9e6" position={[2.2, 2, 4.5]} scale={[0.3, 4, 1]} rotation-y={-Math.PI / 9} />
      <Lightformer form="rect" intensity={7} color="#ffe9b8" position={[0.4, -2.6, 4]} scale={[5, 0.3, 1]} />
      <Lightformer form="rect" intensity={6} color="#ffffff" position={[3.5, -1.5, -2]} scale={[0.4, 5, 1]} rotation-y={Math.PI / 3} />
    </Environment>
  );
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
        <StudioLight resolution={full ? 256 : 128} />
        <Gem anchorId={GEM_ANCHOR_ID} poster={poster} onReady={onReady} />
      </Suspense>
      {!poster && <PerformanceMonitor flipflops={2} onDecline={onDecline} />}
    </Canvas>
  );
}
