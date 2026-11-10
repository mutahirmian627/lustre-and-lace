"use client";

import { useMemo, useRef } from "react";
import { Color, type PointLight } from "three";
import { useFrame } from "@react-three/fiber";
import { ARCHES, smoothstep } from "@/features/immersive/lib/timeline";
import { PORTAL, WALL, zAt } from "@/features/immersive/lib/world";
import { stageState } from "@/features/immersive/lib/stage-state";

const ROSE = new Color("#ff9db8");
const LAMPS = 3;

/** Where each lamp hangs while the camera is still in the gallery (the approved opening). */
const OPENING = [{ z: WALL.z - 8 }, { z: WALL.z - 15 }, { z: WALL.z - 22 }] as const;

/** How quickly a lamp fades as the camera moves away from its arch, in metres. */
const REACH = 5;

interface Signature {
  /** Where the arch's light hangs, relative to the arch: sideways, height, and metres beyond it. */
  lateral: number;
  height: number;
  beyond: number;
  colour: string;
  /** Brightness when the camera is right at the arch. */
  peak: number;
}

/**
 * Each arch has its own light, so the seven feel different: a rose light overhead, an amber one from the side, a
 * cool white one from above, a rose-gold one low to the left, a gold uplight, a lilac one from the right, and at
 * the last a broad gold.
 */
const SIGNATURES: readonly Signature[] = [
  { lateral: 0, height: 5, beyond: 1.5, colour: "#ff9db8", peak: 9 },
  { lateral: 1.4, height: 4.2, beyond: 1, colour: "#ffb48a", peak: 12 },
  { lateral: 0, height: 5.4, beyond: 0, colour: "#d9c8ff", peak: 13 },
  { lateral: -1.6, height: 3.2, beyond: 2, colour: "#ffa99a", peak: 13 },
  { lateral: 0, height: 1.2, beyond: 3, colour: "#ffc27a", peak: 12 },
  { lateral: 1.2, height: 4.5, beyond: 1, colour: "#c9b6ff", peak: 12 },
  { lateral: 0, height: 5, beyond: 2, colour: "#ffd08a", peak: 14 },
];

/**
 * The corridor's light. Each service arch has its own signature (above), but only three lamps exist: each serves every
 * third arch, brightening as the camera nears its arch and fading as it moves on. By the time a lamp is handed to the
 * arch three along, it has long since faded to nothing, so there is no pop. The lamps are fixed in the corridor, not
 * carried with the camera, so you pass through pools of light and shade.
 *
 * While the camera is in the gallery the lamps hold the approved opening's places and colour exactly; they hand over
 * to the arches' lights as the camera goes through the doorway.
 */
export function HallLights() {
  const lamps = useRef<(PointLight | null)[]>([]);
  const colours = useMemo(() => SIGNATURES.map((signature) => new Color(signature.colour)), []);

  useFrame(() => {
    const handover = smoothstep(0.95, 1.12, stageState.value);
    const sigma = stageState.sigma;

    for (let j = 0; j < LAMPS; j++) {
      const lamp = lamps.current[j];
      if (!lamp) continue;

      // The arch this lamp serves now: the nearest of every third arch.
      let arch = j;
      let best = Infinity;
      for (let k = j; k < ARCHES.length; k += LAMPS) {
        const d = Math.abs(sigma - ARCHES[k]);
        if (d < best) {
          best = d;
          arch = k;
        }
      }
      const signature = SIGNATURES[arch];
      const strength = signature.peak * Math.exp(-((best / REACH) ** 2));

      lamp.position.set(
        PORTAL.x + signature.lateral * handover,
        5 + (signature.height - 5) * handover,
        OPENING[j].z + (zAt(ARCHES[arch] + signature.beyond) - OPENING[j].z) * handover
      );
      lamp.intensity = 9 + (strength - 9) * handover;
      lamp.color.copy(ROSE).lerp(colours[arch], handover);
    }
  });

  return (
    <>
      {OPENING.map((place, j) => (
        <pointLight
          key={j}
          ref={(lamp) => {
            lamps.current[j] = lamp;
          }}
          position={[PORTAL.x, 5, place.z]}
          intensity={9}
          distance={8.5}
          decay={1.4}
          color="#ff9db8"
        />
      ))}
    </>
  );
}
