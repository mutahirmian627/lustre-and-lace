"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, MathUtils, MixOperation, type Group, type PerspectiveCamera } from "three";
import { createGemGeometry } from "@/features/immersive/lib/gem-geometry";
import { createStudioCube } from "@/features/immersive/lib/studio-cube";
import { pointer } from "@/features/immersive/lib/pointer";

/** How much of the anchor box the gem's widest point fills. */
const GEM_FILL = 0.44;
/** The pose used for the pre-rendered poster, so the picture and the live gem match. */
const POSTER_POSE = { x: 0.32, y: 0.62, z: 0.08 };

interface GemProps {
  anchorId: string;
  /** Hold the fixed poster pose instead of animating. */
  poster: boolean;
  /** Called once a few frames have actually been drawn. */
  onReady: () => void;
}

/**
 * The hero gem. It lives in the 3D scene but is *attached to a normal page element* (the anchor): each
 * frame it reads the anchor's on-screen box and puts itself there, at the right size. That is what lets
 * ordinary HTML layout decide where the gem sits, scrolls with the page, and works at any screen size.
 */
export function Gem({ anchorId, poster, onReady }: GemProps) {
  const group = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const frames = useRef(0);
  const age = useRef(0); // seconds the gem has been animating, for the ease-in
  const geometry = useMemo(() => createGemGeometry(), []);
  const studio = useMemo(() => createStudioCube(), []);
  useEffect(() => () => studio.dispose(), [studio]);

  useFrame((state, delta) => {
    const g = group.current;
    const s = spin.current;
    if (!g || !s) return;
    anchor.current ??= document.getElementById(anchorId);
    const el = anchor.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const { width, height } = state.size;
    const camera = state.camera as PerspectiveCamera;
    // How many scene units one screen pixel covers at the gem's distance from the camera.
    const unitsPerPx = (2 * camera.position.z * Math.tan(MathUtils.degToRad(camera.fov) / 2)) / height;

    g.position.set(
      (rect.left + rect.width / 2 - width / 2) * unitsPerPx + (poster ? 0 : pointer.x * 0.12),
      -(rect.top + rect.height / 2 - height / 2) * unitsPerPx + (poster ? 0 : pointer.y * 0.08),
      0
    );
    g.scale.setScalar(rect.width * unitsPerPx * GEM_FILL);

    if (poster || frames.current === 0) {
      // The live gem begins in the poster's exact pose, so the hand-over from picture to 3D is invisible.
      s.rotation.set(POSTER_POSE.x, POSTER_POSE.y, POSTER_POSE.z);
    }
    if (!poster) {
      // Then it eases into a slow turn that leans towards the cursor.
      age.current += delta;
      const settle = MathUtils.smoothstep(age.current, 0, 2.2);
      s.rotation.y += delta * (0.05 + 0.2 * settle + pointer.x * 0.35 * settle);
      s.rotation.x = MathUtils.damp(s.rotation.x, 0.3 + pointer.y * 0.4 * settle, 4, delta);
      s.rotation.z = MathUtils.damp(s.rotation.z, 0.08 - pointer.x * 0.2 * settle, 4, delta);
    }

    frames.current += 1;
    if (frames.current === 3) onReady();
  });

  return (
    <group ref={group}>
      <group ref={spin}>
        {/* The inside: back faces only, dark and mirror-like. Seen through the front layer it gives the
            stone depth, the way light bouncing around inside a real gem does. */}
        <mesh geometry={geometry} scale={0.97} renderOrder={1}>
          <meshPhongMaterial
            color="#6a1a3e"
            specular="#ffc2d6"
            shininess={120}
            envMap={studio}
            combine={MixOperation}
            reflectivity={0.55}
            side={BackSide}
          />
        </mesh>
        {/* The outside: glossy and slightly see-through. */}
        <mesh geometry={geometry} renderOrder={2}>
          <meshPhongMaterial
            color="#ee6a96"
            specular="#ffffff"
            shininess={220}
            envMap={studio}
            combine={MixOperation}
            reflectivity={0.5}
            transparent
            opacity={0.74}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
