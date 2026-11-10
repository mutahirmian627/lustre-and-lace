"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { applyFrame } from "@/features/immersive/lib/frame";
import { cameraCurve, journey, lookCurve } from "@/features/immersive/lib/world";
import { pointer } from "@/features/immersive/lib/pointer";
import { stageState } from "@/features/immersive/lib/stage-state";

/**
 * The camera: rides a curve through the gallery, through the doorway and into the hall, a little behind the
 * ribbon. Scroll sets how far along; the position is eased so the camera has weight. The pointer nudges it
 * a few centimetres, enough to make the architecture feel real (parallax) and no more.
 */
export function CameraRig({ frozen }: { frozen: boolean }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const scratch = useMemo(() => ({ position: new Vector3(), target: new Vector3(), px: 0, py: 0 }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (frozen) stageState.value = stageState.target;
    else stageState.value = MathUtils.damp(stageState.value, stageState.target, 4.2, dt);

    const u = journey(stageState.value);
    cameraCurve.getPointAt(u, scratch.position);
    lookCurve.getPointAt(u, scratch.target);

    scratch.px = MathUtils.damp(scratch.px, frozen ? 0 : pointer.x, 3, dt);
    scratch.py = MathUtils.damp(scratch.py, frozen ? 0 : pointer.y, 3, dt);
    scratch.position.x += scratch.px * 0.32;
    scratch.position.y += scratch.py * 0.14;

    camera.position.copy(scratch.position);
    camera.lookAt(scratch.target);
    applyFrame(camera, size.width, size.height);
  });

  return null;
}
