"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, type Texture } from "three";
import { PORTAL, WALL } from "@/features/immersive/lib/world";
import { POSTER_TIME } from "@/features/immersive/lib/stage-state";

const COUNT = 70;

/**
 * A little dust turning in the light that spills out of the doorway. It is there for one reason: it makes
 * the light visible, which is what tells the eye the hall behind the wall is lit from within. A few dozen
 * soft points, drawn in one call, drifting very slowly; none anywhere else.
 */
export function Dust({ glow, frozen }: { glow: Texture; frozen: boolean }) {
  const ref = useRef<Points>(null);

  const { geometry, base } = useMemo(() => {
    const base = new Float32Array(COUNT * 3);
    let seed = 11;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < COUNT; i++) {
      // Inside a cone of light that widens from the doorway into the gallery.
      const depth = random(); // 0 at the doorway, 1 well into the room
      const spread = 1.1 + depth * 2.6;
      base[i * 3] = PORTAL.x + (random() - 0.5) * 2 * spread;
      base[i * 3 + 1] = 0.3 + random() * 3.6;
      base[i * 3 + 2] = WALL.z + 0.3 + depth * 6.5;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(base.slice(), 3));
    return { geometry, base };
  }, []);

  useFrame((state) => {
    const t = frozen ? POSTER_TIME : POSTER_TIME + state.clock.elapsedTime;
    const position = geometry.getAttribute("position") as BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      position.setXYZ(
        i,
        base[i * 3] + Math.sin(t * 0.21 + i * 1.7) * 0.16,
        base[i * 3 + 1] + Math.sin(t * 0.17 + i * 2.3) * 0.2 + ((t * 0.02 * (1 + (i % 3))) % 0.5),
        base[i * 3 + 2] + Math.cos(t * 0.19 + i) * 0.14
      );
    }
    position.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={glow}
        color="#ffd9cf"
        size={0.075}
        sizeAttenuation
        transparent
        opacity={0.55}
        blending={AdditiveBlending}
        depthWrite={false}
        fog={false}
      />
    </points>
  );
}
