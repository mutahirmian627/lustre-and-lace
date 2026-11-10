"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, type PointLight } from "three";
import { PORTAL, WALL, smoothstep } from "@/features/immersive/lib/world";

const ROSE = new Color("#ff9db8");
const GOLD = new Color("#ffc08a");

/** Where each lantern sits when the camera is still in the gallery, and how far ahead of the camera it travels. */
const LANTERNS = [
  { rest: WALL.z - 8, ahead: 4 },
  { rest: WALL.z - 15, ahead: 11 },
  { rest: WALL.z - 22, ahead: 18 },
] as const;

/**
 * Three soft lights high in the hall. While the camera is still in the gallery they hold their places behind
 * the wall; once it is inside they travel with it, a little ahead, so the hall is lit the same way however far
 * down it you are. Their colour drifts slowly from rose towards warm gold the deeper you go, so the space
 * changes without anything new being added to it.
 */
export function HallLights() {
  const camera = useThree((state) => state.camera);
  const lights = useRef<(PointLight | null)[]>([]);

  useFrame(() => {
    const cameraZ = camera.position.z;
    const depth = smoothstep(-14, -46, cameraZ);
    for (let i = 0; i < LANTERNS.length; i++) {
      const light = lights.current[i];
      if (!light) continue;
      light.position.z = Math.min(LANTERNS[i].rest, cameraZ - LANTERNS[i].ahead);
      light.color.copy(ROSE).lerp(GOLD, depth * 0.7);
    }
  });

  return (
    <>
      {LANTERNS.map((lantern, i) => (
        <pointLight
          key={i}
          ref={(light) => {
            lights.current[i] = light;
          }}
          position={[PORTAL.x, 5, lantern.rest]}
          intensity={9}
          distance={8.5}
          decay={1.4}
          color="#ff9db8"
        />
      ))}
    </>
  );
}
