"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { applyFrame } from "@/features/immersive/lib/frame";
import { cameraPose, type CameraPose } from "@/features/immersive/lib/corridor";
import { HALL_START_SIGMA, hallSigma } from "@/features/immersive/lib/timeline";
import { cameraCurve, journey, lookCurve } from "@/features/immersive/lib/world";
import { pointer } from "@/features/immersive/lib/pointer";
import { stageState } from "@/features/immersive/lib/stage-state";

/**
 * The camera: rides a curve through the gallery, through the doorway and into the hall, then on down the hall,
 * a little behind the ribbon. Scroll sets how far along; the position is eased so the camera has weight. The pointer nudges it
 * a few centimetres, enough to make the architecture feel real (parallax) and no more.
 */
export function CameraRig({ frozen }: { frozen: boolean }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const scratch = useMemo(() => ({ position: new Vector3(), target: new Vector3(), px: 0, py: 0, pose: { fov: 0, roll: 0 } as CameraPose }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const before = stageState.value;
    if (frozen) stageState.value = stageState.target;
    else stageState.value = MathUtils.damp(stageState.value, stageState.target, 4.2, dt);
    // How fast the visitor is scrolling right now (smoothed): the ribbon's ripple follows it.
    stageState.speed = MathUtils.damp(stageState.speed, frozen ? 0 : Math.abs(stageState.value - before) / Math.max(dt, 0.001), 4, dt);

    // Scenes 0..1 are the opening; 1..2 are the long glide down the hall. The two routes meet at the same point.
    const progress = stageState.value;
    scratch.pose.fov = 0;
    scratch.pose.roll = 0;
    if (progress <= 1) {
      const u = journey(progress);
      cameraCurve.getPointAt(u, scratch.position);
      lookCurve.getPointAt(u, scratch.target);
      stageState.sigma = HALL_START_SIGMA;
    } else {
      // In the corridor the camera's framing is a function of how far down it we are (lib/corridor.ts).
      const sigma = hallSigma(progress - 1);
      stageState.sigma = sigma;
      cameraPose(sigma, scratch.position, scratch.target, scratch.pose);
    }

    scratch.px = MathUtils.damp(scratch.px, frozen ? 0 : pointer.x, 3, dt);
    scratch.py = MathUtils.damp(scratch.py, frozen ? 0 : pointer.y, 3, dt);
    scratch.position.x += scratch.px * 0.32;
    scratch.position.y += scratch.py * 0.14;

    camera.position.copy(scratch.position);
    stageState.camera.x = scratch.position.x;
    stageState.camera.y = scratch.position.y;
    stageState.camera.z = scratch.position.z;
    camera.lookAt(scratch.target);
    if (scratch.pose.roll) camera.rotateZ(scratch.pose.roll);
    applyFrame(camera, size.width, size.height, scratch.pose.fov);
  });

  return null;
}
