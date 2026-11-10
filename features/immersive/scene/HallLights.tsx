"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Vector3, type PointLight } from "three";
import { LIGHT_SIGNATURES, newFrame, spineFrame } from "@/features/immersive/lib/corridor";
import { ARCHES, smoothstep } from "@/features/immersive/lib/timeline";
import { PORTAL, WALL } from "@/features/immersive/lib/world";
import { stageState } from "@/features/immersive/lib/stage-state";

const ROSE = new Color("#ff9db8");
const LAMPS = 3;
const UP = new Vector3(0, 1, 0);

/** Where each lamp hangs while the camera is still in the gallery (the approved opening). */
const OPENING = [{ z: WALL.z - 8 }, { z: WALL.z - 15 }, { z: WALL.z - 22 }] as const;

/** How quickly a lamp fades as the camera moves away from its arch, in metres. */
const REACH = 5;

/**
 * The corridor's light. Each service arch has its own signature (colour, direction, strength: see
 * LIGHT_SIGNATURES in lib/corridor.ts), but only three lamps exist: each serves every third arch, brightening as the
 * camera nears its arch and fading as it moves on. By the time a lamp is handed to the arch three along, it has
 * long since faded to nothing, so there is no pop.
 *
 * Unlike the straight hall's lanterns, these are fixed in the corridor rather than carried with the camera, so you
 * travel through pools of light and shade, and each arch is a different moment.
 *
 * While the camera is in the gallery the lamps hold the approved opening's places and colour; they hand over to
 * the arches' lights as the camera goes through the doorway.
 */
export function HallLights() {
  const lamps = useRef<(PointLight | null)[]>([]);
  const frame = useMemo(() => newFrame(), []);
  const colours = useMemo(() => LIGHT_SIGNATURES.map((signature) => new Color(signature.colour)), []);
  const target = useMemo(() => new Vector3(), []);

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
      const signature = LIGHT_SIGNATURES[arch];
      spineFrame(ARCHES[arch] + signature.beyond, frame);
      target.copy(frame.point).addScaledVector(frame.right, signature.lateral).addScaledVector(UP, signature.height);
      const strength = signature.peak * Math.exp(-((best / REACH) ** 2));

      lamp.position.set(
        PORTAL.x + (target.x - PORTAL.x) * handover,
        5 + (target.y - 5) * handover,
        OPENING[j].z + (target.z - OPENING[j].z) * handover
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
