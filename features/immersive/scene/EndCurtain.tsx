"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, Color, Group, MeshBasicMaterial, ShapeGeometry, type Texture } from "three";
import { archShape } from "@/features/immersive/lib/arch";
import { DOOR_SIGMA, smoothstep } from "@/features/immersive/lib/timeline";
import { HALL, PORTAL, zAt } from "@/features/immersive/lib/world";
import { stageState } from "@/features/immersive/lib/stage-state";

/** The door of light that has always stood at the far end of the hall. */
const DOOR = { width: 2.6, straight: 1.9 } as const;
const endZ = zAt(DOOR_SIGMA);

/** How far (metres) the camera is from the end of the corridor while the curtain is fully there, and while it has gone. */
const THERE = 46;
const GONE = 34;

/**
 * The far end of the corridor as the approved opening has it: a dark wall with one small door of light in it, and a halo.
 * Behind it, now, is the large lattice doorway and the ivory hall; this curtain hides them while the camera is far away
 * (so the opening and the long first stretch look exactly as they did) and dissolves as the camera comes within about 40 m,
 * so the doorway's lattice and the light of the room behind it arrive as the end of the corridor draws near.
 */
export function EndCurtain({ glow, lite }: { glow: Texture; lite: boolean }) {
  const group = useRef<Group>(null);

  const parts = useMemo(() => {
    const segments = lite ? 24 : 44;
    const endWall = new ShapeGeometry(archShape(HALL.width - 0.02, HALL.straight), segments);
    const door = new ShapeGeometry(archShape(DOOR.width, DOOR.straight), segments);
    // Lit from within: warm white at the floor, rose-gold at the crown.
    const position = door.getAttribute("position");
    const colours = new Float32Array(position.count * 3);
    const low = new Color("#fff4e8");
    const high = new Color("#ffb99c");
    for (let i = 0; i < position.count; i++) {
      const t = Math.min(1, Math.max(0, position.getY(i) / (DOOR.straight + DOOR.width / 2)));
      const colour = low.clone().lerp(high, t * t);
      colours.set([colour.r, colour.g, colour.b], i * 3);
    }
    door.setAttribute("color", new BufferAttribute(colours, 3));
    const wallMaterial = new MeshBasicMaterial({ color: "#1b0c22", fog: false, toneMapped: false });
    const doorMaterial = new MeshBasicMaterial({ vertexColors: true, fog: false, toneMapped: false });
    const haloMaterial = new MeshBasicMaterial({
      map: glow,
      color: "#f2b9a8",
      opacity: 0.5,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    return { endWall, door, wallMaterial, doorMaterial, haloMaterial };
  }, [glow, lite]);

  useFrame(() => {
    const away = stageState.camera.z - endZ;
    const there = smoothstep(GONE, THERE, away);
    if (group.current) group.current.visible = there > 0.004;
    // Opaque while it is fully there, exactly as before; fading only while it dissolves.
    const solid = there > 0.999;
    parts.wallMaterial.transparent = parts.doorMaterial.transparent = !solid;
    parts.wallMaterial.opacity = parts.doorMaterial.opacity = there;
    parts.haloMaterial.opacity = 0.5 * there;
  });

  return (
    <group ref={group}>
      <mesh geometry={parts.endWall} material={parts.wallMaterial} position={[PORTAL.x, 0, endZ + 0.02]} />
      <mesh geometry={parts.door} material={parts.doorMaterial} position={[PORTAL.x, 0, endZ + 0.04]} />
      <mesh material={parts.haloMaterial} position={[PORTAL.x, 2.2, endZ + 0.06]}>
        <planeGeometry args={[7.5, 7.5]} />
      </mesh>
    </group>
  );
}
