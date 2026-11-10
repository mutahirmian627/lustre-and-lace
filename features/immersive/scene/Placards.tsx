"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { PORTAL, WALL, ribbonCurve, smoothstep } from "@/features/immersive/lib/world";
import { stageState } from "@/features/immersive/lib/stage-state";

/**
 * Gallery labels: small captions in the page's own typography that are pinned to points in the 3D scene,
 * the way a museum label sits beside an object. The HTML elements (marked `data-placard="name"`) live in the
 * page, so they are real text; this component only moves them each frame to wherever the point is on screen.
 *
 * They exist to say what the viewer is looking at (the materials, the structure) and to tie the page's
 * typography to the scene. They fade as soon as the visitor starts to scroll.
 */
const ANCHORS: Record<string, Vector3> = {
  ribbon: ribbonCurve.getPointAt(0.085),
  portal: new Vector3(PORTAL.x + PORTAL.width / 2 + 0.12, PORTAL.straight + 0.2, WALL.z),
};

export function Placards() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const elements = useRef<{ el: HTMLElement; anchor: Vector3 }[]>([]);
  const scratch = useMemo(() => new Vector3(), []);

  useEffect(() => {
    elements.current = Array.from(document.querySelectorAll<HTMLElement>("[data-placard]"))
      .map((el) => ({ el, anchor: ANCHORS[el.dataset.placard ?? ""] }))
      .filter((entry): entry is { el: HTMLElement; anchor: Vector3 } => Boolean(entry.anchor));
    return () => {
      for (const { el } of elements.current) {
        el.style.opacity = "";
        el.style.transform = "";
        delete el.dataset.placed;
      }
    };
  }, []);

  useFrame(() => {
    const visible = 1 - smoothstep(0.015, 0.12, stageState.value);
    camera.updateMatrixWorld();
    for (const { el, anchor } of elements.current) {
      scratch.copy(anchor).project(camera);
      const x = (scratch.x * 0.5 + 0.5) * size.width;
      const y = (-scratch.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = visible.toFixed(3);
      el.dataset.placed = "1";
    }
  });

  return null;
}
