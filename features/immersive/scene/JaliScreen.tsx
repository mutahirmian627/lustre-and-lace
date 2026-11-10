"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, ShapeGeometry, type Texture } from "three";
import { archLeaf } from "@/features/immersive/lib/arch";
import type { Materials } from "@/features/immersive/lib/materials";
import { PORTAL, SCREEN_GAP, SCREEN_Z, TIMELINE, smoothstep } from "@/features/immersive/lib/world";
import { stageState } from "@/features/immersive/lib/stage-state";

/** One repeat of the lattice is this many metres across. */
const CELL = 0.6;

interface JaliScreenProps {
  materials: Materials;
  jaliMask: Texture;
  lite: boolean;
}

/**
 * The lattice screen that fills the doorway: two leaves of frosted glass, each a lattice of fine bars with
 * clear gaps between them, so the hall's light comes through the pattern. A second, fainter lattice sits a
 * hand's breadth behind the first, offset by half a cell, so as the camera moves the two slide against each
 * other and the screen gains depth without any extra geometry.
 *
 * A narrow gap is left between the leaves for the ribbon to run through. As the visitor scrolls the leaves
 * slide apart into the thickness of the wall, which is the transition from the gallery into the hall.
 */
export function JaliScreen({ materials, jaliMask, lite }: JaliScreenProps) {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);

  const parts = useMemo(() => {
    const segments = lite ? 24 : 48;
    const width = PORTAL.width - 0.02;
    const leftGeometry = new ShapeGeometry(archLeaf(width, PORTAL.straight, SCREEN_GAP, -1), segments);
    const rightGeometry = new ShapeGeometry(archLeaf(width, PORTAL.straight, SCREEN_GAP, 1), segments);

    const frontMask = jaliMask;
    frontMask.repeat.set(1 / CELL, 1 / CELL);

    const backMask = jaliMask.clone();
    backMask.needsUpdate = true;
    backMask.repeat.set(1 / CELL, 1 / CELL);
    backMask.offset.set(0.5, 0.5);

    const front = materials.glass;
    front.alphaMap = frontMask;
    const back = materials.glassBack;
    back.alphaMap = backMask;
    return { leftGeometry, rightGeometry };
  }, [materials, jaliMask, lite]);

  useFrame(() => {
    const open = smoothstep(TIMELINE.screenOpen[0], TIMELINE.screenOpen[1], stageState.value);
    const travel = open * (PORTAL.width / 2 + 0.2);
    if (left.current) left.current.position.x = -travel;
    if (right.current) right.current.position.x = travel;
  });

  return (
    <group position={[PORTAL.x, 0, SCREEN_Z]}>
      <group ref={left}>
        <mesh geometry={parts.leftGeometry} material={materials.glass} renderOrder={2} />
        {!lite && <mesh geometry={parts.leftGeometry} material={materials.glassBack} position={[0, 0, -0.09]} renderOrder={1} />}
      </group>
      <group ref={right}>
        <mesh geometry={parts.rightGeometry} material={materials.glass} renderOrder={2} />
        {!lite && <mesh geometry={parts.rightGeometry} material={materials.glassBack} position={[0, 0, -0.09]} renderOrder={1} />}
      </group>
    </group>
  );
}
