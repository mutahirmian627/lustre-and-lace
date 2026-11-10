"use client";

import { useEffect, useMemo } from "react";
import { AdditiveBlending, BackSide, Color, DoubleSide, ExtrudeGeometry, MeshBasicMaterial, ShapeGeometry, TubeGeometry, type Texture } from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { archRing, archShape } from "@/features/immersive/lib/arch";
import type { Materials } from "@/features/immersive/lib/materials";
import { DOOR_SIGMA } from "@/features/immersive/lib/timeline";
import { BIG_DOOR, HALL, IVORY, PORTAL, zAt } from "@/features/immersive/lib/world";
import { doorwayOutline } from "@/features/immersive/scene/Architecture";

interface IvoryHallProps {
  materials: Materials;
  tileMap: Texture;
  jaliMask: Texture;
  glow: Texture;
  lite: boolean;
}

const TILE = 1.6;
const doorZ = zAt(DOOR_SIGMA);
const endZ = doorZ - IVORY.length;
/**
 * Where the lattice windows stand down the room (σ): all down the left wall, level with the camera's stops; on the right
 * wall, where the works hang, only beyond them, round the sculpture. The ribs stand between the works.
 */
const WINDOWS_LEFT = [77, 84, 91, 98, 105, 112, 119] as const;
const WINDOWS_RIGHT = [112, 119] as const;
const RIBS = [83.5, 90.5, 97.5, 107.5, 114.5, 121.5] as const;
const WINDOW = { width: 2.2, straight: 2.7, sill: 0.45 } as const;

/**
 * The room beyond the large doorway: a spacious barrel vault in ivory ceramic with a tiled floor, lit by tall lattice
 * windows down both sides and at the far end, which throw their light across the floor. Everything is the same arch
 * silhouette as the corridor, at about twice the size. The ribbon's sculpture hangs in the middle of it (see Ribbon).
 * Also here: the frame of the large doorway itself, which is the corridor's last rib with a great opening in it.
 */
export function IvoryHall({ materials, tileMap, jaliMask, glow, lite }: IvoryHallProps) {
  const parts = useMemo(() => {
    const segments = lite ? 24 : 44;
    const smooth = (geometry: ExtrudeGeometry) => toCreasedNormals(geometry, Math.PI / 9);

    const shell = smooth(
      new ExtrudeGeometry(archShape(IVORY.width, IVORY.straight), { depth: IVORY.length, steps: Math.round(IVORY.length / 2), bevelEnabled: false, curveSegments: segments })
    );
    const rib = smooth(
      new ExtrudeGeometry(archRing(IVORY.width + 0.1, IVORY.straight, IVORY.width - 0.8, IVORY.straight), { depth: 0.3, bevelEnabled: false, curveSegments: segments })
    );
    // The large doorway's frame: the corridor's own arch, with the great opening cut from it.
    const frame = smooth(
      new ExtrudeGeometry(archRing(HALL.width + 0.12, HALL.straight, BIG_DOOR.width, BIG_DOOR.straight), { depth: 0.34, bevelEnabled: false, curveSegments: segments })
    );
    const inlay = new TubeGeometry(doorwayOutline(BIG_DOOR.width, BIG_DOOR.straight, 0.06), lite ? 90 : 160, 0.016, 6, false);

    const windowShape = new ShapeGeometry(archShape(WINDOW.width, WINDOW.straight), segments);
    const windowFrame = smooth(
      new ExtrudeGeometry(archRing(WINDOW.width + 0.34, WINDOW.straight + 0.08, WINDOW.width, WINDOW.straight), { depth: 0.1, bevelEnabled: false, curveSegments: segments })
    );
    const endShape = new ShapeGeometry(archShape(4.6, 4.4), segments);

    // The room's materials: glazed ivory, as the gallery's, seen from the inside.
    const shellMaterial = materials.ceramic.clone();
    shellMaterial.side = BackSide;
    const floorMaterial = materials.ceramic.clone();
    const floorMap = tileMap.clone();
    floorMap.needsUpdate = true;
    floorMap.repeat.set(IVORY.width / TILE, IVORY.length / TILE);
    floorMaterial.map = floorMap;
    floorMaterial.color.set(0xffffff);
    const ribMaterial = materials.ceramic.clone();
    const windowGlass = new MeshBasicMaterial({ color: "#fff1dc", fog: false, toneMapped: false });
    // The lattice: bars in warm shade over the bright window.
    const bars = jaliMask.clone();
    bars.needsUpdate = true;
    bars.repeat.set(1 / 0.5, 1 / 0.5);
    const barMaterial = new MeshBasicMaterial({ color: "#a98f74", alphaMap: bars, transparent: true, opacity: 0.9, depthWrite: false, fog: false, toneMapped: false, side: DoubleSide });
    const lightMaterial = new MeshBasicMaterial({ map: glow, color: "#ffe0b8", opacity: 0.55, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
    const poolMaterial = new MeshBasicMaterial({ map: glow, color: "#ffdcae", opacity: 0.32, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
    const poolPattern = jaliMask.clone();
    poolPattern.needsUpdate = true;
    poolPattern.repeat.set(4.2 / 0.5, 3.4 / 0.5);
    const poolBars = new MeshBasicMaterial({ color: new Color("#8a7585"), alphaMap: poolPattern, transparent: true, opacity: 0.1, depthWrite: false, fog: false, toneMapped: false });
    return { shell, rib, frame, inlay, windowShape, windowFrame, endShape, shellMaterial, floorMaterial, ribMaterial, windowGlass, barMaterial, lightMaterial, poolMaterial, poolBars, bars, poolPattern, floorMap };
  }, [materials, tileMap, jaliMask, glow, lite]);

  useEffect(
    () => () => {
      parts.bars.dispose();
      parts.poolPattern.dispose();
      parts.floorMap.dispose();
    },
    [parts]
  );

  /** One lattice window in a side wall (`side` -1 the left wall, +1 the right) at distance σ down the hall. */
  const sideWindow = (sigma: number, side: -1 | 1) => {
    const x = PORTAL.x + side * (IVORY.width / 2 - 0.01);
    const z = zAt(sigma);
    const turn = side === -1 ? Math.PI / 2 : -Math.PI / 2; // face into the room
    return (
      <group key={`${sigma}-${side}`}>
        <group position={[x, WINDOW.sill, z]} rotation={[0, turn, 0]}>
          <mesh geometry={parts.windowShape} material={parts.windowGlass} />
          <mesh geometry={parts.windowShape} material={parts.barMaterial} position={[0, 0, 0.012]} renderOrder={1} />
          <mesh geometry={parts.windowFrame} material={parts.ribMaterial} position={[0, -0.04, -0.04]} />
          {/* The window's light, spilling into the room. */}
          <mesh position={[0, 2.1, 0.5]} material={parts.lightMaterial} renderOrder={0}>
            <planeGeometry args={[4.6, 6.4]} />
          </mesh>
        </group>
        {/* A pool of light on the floor, with the lattice's shadow in it. */}
        {!lite && (
          <group position={[x - side * 2.9, 0.014, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh material={parts.poolMaterial}>
              <planeGeometry args={[5.2, 4.6]} />
            </mesh>
            <mesh material={parts.poolBars} position={[0, 0, 0.001]} renderOrder={1}>
              <planeGeometry args={[4.2, 3.4]} />
            </mesh>
          </group>
        )}
      </group>
    );
  };

  return (
    <group>
      {/* The large doorway's frame and the chrome line inlaid round it, as at the gallery's portal. */}
      <mesh geometry={parts.frame} material={parts.ribMaterial} position={[PORTAL.x, 0, doorZ]} />
      <mesh geometry={parts.inlay} material={materials.chrome} position={[PORTAL.x, 0, doorZ + 0.352]} />

      {/* The room. */}
      <mesh geometry={parts.shell} material={parts.shellMaterial} position={[PORTAL.x, 0, endZ]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PORTAL.x, 0.004, doorZ - IVORY.length / 2]} material={parts.floorMaterial}>
        <planeGeometry args={[IVORY.width, IVORY.length]} />
      </mesh>
      {RIBS.map((sigma) => (
        <mesh key={sigma} geometry={parts.rib} material={parts.ribMaterial} position={[PORTAL.x, 0, zAt(sigma)]} />
      ))}
      {WINDOWS_LEFT.map((sigma) => sideWindow(sigma, -1))}
      {WINDOWS_RIGHT.map((sigma) => sideWindow(sigma, 1))}

      {/* The far end: one tall lattice window, the room's brightest place. */}
      <group position={[PORTAL.x, 0, endZ + 0.02]}>
        <mesh geometry={parts.endShape} material={parts.windowGlass} />
        <mesh geometry={parts.endShape} material={parts.barMaterial} position={[0, 0, 0.012]} renderOrder={1} />
        <mesh position={[0, 3.2, 0.6]} material={parts.lightMaterial} renderOrder={0}>
          <planeGeometry args={[9, 10]} />
        </mesh>
      </group>
    </group>
  );
}
