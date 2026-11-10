"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { smoothstep } from "@/features/immersive/lib/timeline";
import { stageState } from "@/features/immersive/lib/stage-state";
import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  CatmullRomCurve3,
  ExtrudeGeometry,
  Group,
  Mesh,
  ShapeGeometry,
  Texture,
  TubeGeometry,
  Vector3,
} from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { archRing, archShape, wallWithArch } from "@/features/immersive/lib/arch";
import { buildHallGeometry, hallScale, HEAVY_ARCHES, ribMatrices, spineFrame, THIN_RIBS } from "@/features/immersive/lib/corridor";
import { DOOR_SIGMA } from "@/features/immersive/lib/timeline";
import { createContactShadeTexture } from "@/features/immersive/lib/textures";
import type { Materials } from "@/features/immersive/lib/materials";
import { HALL, PORTAL, WALL } from "@/features/immersive/lib/world";

interface ArchitectureProps {
  materials: Materials;
  tileMap: Texture;
  glow: Texture;
  lite: boolean;
}

const TILE = 1.6;
/** The door of light at the far end of the hall. */
const DOOR = { width: 2.6, straight: 1.9 } as const;
const FLOOR = { width: 120, depth: 60 } as const;

/** The stretches of wall either side of the doorway. */
const contactSegments: [number, number][] = [
  [-WALL.width / 2, PORTAL.x - PORTAL.width / 2],
  [PORTAL.x + PORTAL.width / 2, WALL.width / 2],
];

/** The outline of a doorway, slightly larger than the opening, as points for a thin tube. */
function doorwayOutline(width: number, straight: number, grow: number) {
  const r = width / 2 + grow;
  const points: Vector3[] = [];
  for (let y = 0; y <= straight; y += straight / 6) points.push(new Vector3(-r, y, 0));
  for (let a = Math.PI; a >= 0; a -= Math.PI / 40) points.push(new Vector3(r * Math.cos(a), straight + r * Math.sin(a), 0));
  for (let y = straight; y >= 0; y -= straight / 6) points.push(new Vector3(r, y, 0));
  return new CatmullRomCurve3(points, false, "chordal");
}

/**
 * The building: the gallery's floor and far wall with its doorway (the portal), a chrome line inlaid around
 * the doorway, and behind it the hall: an arch-section tunnel in plum lacquer with ivory arches (ribs)
 * every few metres, and a rose-gold light at the far end.
 *
 * Everything is the one arch silhouette. The hall is that silhouette swept along the corridor's centre line
 * (lib/corridor.ts) and seen from inside, so its floor, walls and vault are one mesh; it runs straight for its
 * first dozen metres, as the approved opening shows, then makes a gentle S-bend. Two kinds of arch stand in it:
 * thin ribs, and the seven heavier service arches.
 */
export function Architecture({ materials, tileMap, glow, lite }: ArchitectureProps) {
  const parts = useMemo(() => {
    const curveSegments = lite ? 24 : 44;

    // Extruded shapes come with flat, faceted normals; smooth them across gentle angles (the curve of an
    // arch) while keeping the corners crisp, so a nearby light doesn't break into stripes on the vault.
    const smooth = (geometry: ExtrudeGeometry) => toCreasedNormals(geometry, Math.PI / 9);

    const wall = new ExtrudeGeometry(wallWithArch(WALL.width, WALL.height, PORTAL.width, PORTAL.straight, PORTAL.x), {
      depth: WALL.depth,
      bevelEnabled: false,
      curveSegments,
    });
    const hall = buildHallGeometry(lite);
    // Each arch ring is built about its own middle, so it can stand on the centre line.
    const centred = (shape: ReturnType<typeof archRing>, depth: number) => {
      const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments });
      geometry.translate(0, 0, -depth / 2);
      return toCreasedNormals(geometry, Math.PI / 9);
    };
    const rib = centred(archRing(HALL.width + 0.12, HALL.straight, HALL.width - 0.7, HALL.straight), 0.34);
    // The service arches are heavier and deeper than the ribs between them, so they read as the ones that matter.
    const heroRib = centred(archRing(HALL.width + 0.34, HALL.straight, HALL.width - 1.25, HALL.straight), 0.72);
    // The end of the hall: a dark wall with one arched door of light in it, the same silhouette as everything else.
    const endWall = new ShapeGeometry(archShape(HALL.width - 0.02, HALL.straight), curveSegments);
    const door = new ShapeGeometry(archShape(DOOR.width, DOOR.straight), curveSegments);
    // Lit from within: warm white at the floor, rose-gold at the crown.
    const doorPosition = door.getAttribute("position");
    const doorColours = new Float32Array(doorPosition.count * 3);
    const low = new Color("#fff4e8");
    const high = new Color("#ffb99c");
    for (let i = 0; i < doorPosition.count; i++) {
      const t = Math.min(1, Math.max(0, doorPosition.getY(i) / (DOOR.straight + DOOR.width / 2)));
      const colour = low.clone().lerp(high, t * t);
      doorColours.set([colour.r, colour.g, colour.b], i * 3);
    }
    door.setAttribute("color", new BufferAttribute(doorColours, 3));
    const inlay = new TubeGeometry(doorwayOutline(PORTAL.width, PORTAL.straight, 0.11), lite ? 90 : 160, 0.014, 6, false);

    // The floor is tiled in 1.6 m squares; the wall is plain glazed ivory.
    const floorMaterial = materials.ceramic.clone();
    const floorMap = tileMap.clone();
    floorMap.needsUpdate = true;
    floorMap.repeat.set(FLOOR.width / TILE, FLOOR.depth / TILE);
    floorMaterial.map = floorMap;
    floorMaterial.color.set(0xffffff);
    const wallMaterial = materials.ceramic;
    const ribMaterial = materials.ceramic.clone();
    ribMaterial.fog = false;
    ribMaterial.color.set(0xa398a6); // a lilac-tinted ivory, so the ribs belong to the hall's light rather than the gallery's
    const contact = createContactShadeTexture();

    // The arches stand on the centre line: one instanced draw for the thin ribs, one for the service arches.
    const standing = (geometry: typeof rib, material: typeof ribMaterial, sigmas: readonly number[]) => {
      const group = new Group();
      ribMatrices(sigmas).forEach((matrix) => {
        const mesh = new Mesh(geometry, material);
        mesh.matrixAutoUpdate = false;
        mesh.matrix.copy(matrix);
        mesh.frustumCulled = false;
        group.add(mesh);
      });
      return group;
    };
    const thinRibs = standing(rib, ribMaterial, THIN_RIBS);
    // Heavier collars round the service arches, drawn once the visitor is inside the hall.
    const collarMaterial = ribMaterial.clone();
    collarMaterial.color.set(0xa99dac);
    collarMaterial.transparent = true;
    collarMaterial.opacity = 0;
    collarMaterial.depthWrite = false;
    const serviceArches = standing(heroRib, collarMaterial, HEAVY_ARCHES);
    serviceArches.visible = false;

    const end = spineFrame(DOOR_SIGMA);
    const endScale = hallScale(DOOR_SIGMA);
    return { collarMaterial, wall: smooth(wall), hall, endWall, door, inlay, wallMaterial, floorMaterial, contact, thinRibs, serviceArches, end, endScale };
  }, [materials, tileMap, lite]);

  // The collars appear as the camera goes through the doorway, out of sight of the gallery's view of the hall.
  useFrame(() => {
    const amount = smoothstep(0.62, 0.95, stageState.value);
    parts.collarMaterial.opacity = amount;
    parts.serviceArches.visible = amount > 0.01;
  });

  return (
    <group>
      {/* Gallery floor: from the wall towards the viewer and out to the sides, fading into the room's colour with distance. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, WALL.z + 30]} material={parts.floorMaterial}>
        <planeGeometry args={[FLOOR.width, FLOOR.depth]} />
      </mesh>

      {/* The far wall with its doorway. Extrusions run along +z, so it starts at the back face. */}
      <mesh geometry={parts.wall} material={parts.wallMaterial} position={[0, 0, WALL.z - WALL.depth]} />

      {/* Soft occlusion where the wall meets the floor, on both sides of the doorway. */}
      {contactSegments.map(([x0, x1], k) => (
        <group key={k}>
          <mesh position={[(x0 + x1) / 2, 0.7, WALL.z + 0.004]}>
            <planeGeometry args={[x1 - x0, 1.4]} />
            <meshBasicMaterial map={parts.contact} transparent depthWrite={false} fog={false} toneMapped={false} />
          </mesh>
          <mesh position={[(x0 + x1) / 2, 0.006, WALL.z + 0.8]} rotation={[-Math.PI / 2, 0, Math.PI]}>
            <planeGeometry args={[x1 - x0, 1.6]} />
            <meshBasicMaterial map={parts.contact} transparent depthWrite={false} fog={false} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Chrome line inlaid around the doorway. */}
      <mesh geometry={parts.inlay} material={materials.chrome} position={[PORTAL.x, 0, WALL.z + 0.012]} />

      {/* The hall, seen from inside. */}
      <mesh geometry={parts.hall} material={materials.lacquerInside} frustumCulled={false} />

      {/* Ribs along the hall, and the seven service arches. */}
      <primitive object={parts.thinRibs} />
      <primitive object={parts.serviceArches} />

      {/* The end of the hall: a dark wall, an arched door of light, and a halo round it. */}
      <mesh geometry={parts.endWall} position={[parts.end.point.x, 0, parts.end.point.z + 0.02]} scale={parts.endScale}>
        <meshBasicMaterial color="#1b0c22" fog={false} toneMapped={false} />
      </mesh>
      <mesh geometry={parts.door} position={[parts.end.point.x, 0, parts.end.point.z + 0.04]} scale={parts.endScale}>
        <meshBasicMaterial vertexColors fog={false} toneMapped={false} />
      </mesh>
      <mesh position={[parts.end.point.x, 2.2 * parts.endScale, parts.end.point.z + 0.06]}>
        <planeGeometry args={[7.5, 7.5]} />
        <meshBasicMaterial
          map={glow}
          color="#f2b9a8"
          opacity={0.5}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>

      {/* A pool of warm light on the gallery floor where the hall's glow spills out of the doorway. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[PORTAL.x, 0.012, WALL.z + 1.4]}>
        <planeGeometry args={[4.6, 6.4]} />
        <meshBasicMaterial
          map={glow}
          color="#e7b1b4"
          opacity={0.3}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
