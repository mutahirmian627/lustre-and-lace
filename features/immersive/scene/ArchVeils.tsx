"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, Color, Group, MeshBasicMaterial, MeshPhongMaterial, ShapeGeometry, type Texture } from "three";
import { archLeaf } from "@/features/immersive/lib/arch";
import type { Materials } from "@/features/immersive/lib/materials";
import { ARCHES, DOOR_SIGMA, GATES, veilAt } from "@/features/immersive/lib/timeline";
import { BIG_DOOR, HALL, PORTAL, SCREEN_GAP, zAt } from "@/features/immersive/lib/world";
import { stageState } from "@/features/immersive/lib/stage-state";
import { SIGNATURES } from "@/features/immersive/scene/HallLights";

/**
 * The seven service arches as events. Each rib the services stand under holds a lattice veil, the same frosted lattice
 * as the screen in the gallery's doorway: two leaves with a gap down the middle where the ribbon runs through. The veil
 * is closed as the arch comes into view ahead, and parts by the camera's distance from it (so it is the visitor's own
 * approach that opens it, and the opening stays open behind them). No two are the same: four lattices (scale, angle and
 * tint), three ways of parting (both leaves slide aside; both lift into the vault; one slides and one lifts), slightly
 * different moments of parting, and a glow in the arch's own colour that swells as the veil opens.
 *
 * It reads only where the camera is, never the ribbon; and while the arch is far away it is invisible, so the approved
 * opening's view down the hall is exactly what it was.
 */

interface Lattice {
  /** Metres per repeat of the pattern. */
  cell: number;
  /** Angle of the pattern, in radians. */
  angle: number;
  /** Tints for the front glass and its glow, as in the materials' own glass. */
  colour: string;
  emissive: string;
}

const LATTICES: readonly Lattice[] = [
  { cell: 0.6, angle: 0, colour: "#e8e1f4", emissive: "#4a3a66" }, // the gallery's own screen
  { cell: 0.42, angle: Math.PI / 4, colour: "#f4dde6", emissive: "#663a52" }, // fine, on the diagonal, rose
  { cell: 0.85, angle: 0, colour: "#e3dcff", emissive: "#40367a" }, // broad, lilac
  { cell: 0.55, angle: Math.PI / 8, colour: "#f4e6cf", emissive: "#66502f" }, // turned a little, champagne
  { cell: 0.9, angle: 0, colour: "#f7ecd9", emissive: "#6b5a3a" }, // the large doorway's: broad and warm, the ivory hall's own
  // The process's five gates: the same warm glass, the lattice growing broader at each, until the last is nearly open.
  { cell: 0.5, angle: 0, colour: "#f7ecd9", emissive: "#6b5a3a" },
  { cell: 0.7, angle: Math.PI / 8, colour: "#f7ecd9", emissive: "#6b5a3a" },
  { cell: 1.0, angle: 0, colour: "#f8efdf", emissive: "#6b5a3a" },
  { cell: 1.4, angle: Math.PI / 4, colour: "#f9f1e3", emissive: "#6b5a3a" },
  { cell: 2.0, angle: 0, colour: "#faf3e8", emissive: "#6b5a3a" },
];

type Parting = "split" | "rise" | "mixed";

interface Event {
  /** Where along the corridor (σ) its rib stands. */
  sigma: number;
  lattice: number;
  parting: Parting;
  /** The camera's distance from the arch (metres) where the veil starts and finishes parting. */
  from: number;
  to: number;
  /** The opening it fills. */
  size: "arch" | "door";
  /** The camera's distance from it over which it fades in: invisible beyond `fadeFar`, fully there inside `fadeNear`. */
  fadeNear: number;
  fadeFar: number;
  /** Its glow's colour and size. */
  halo: string;
  haloSize: number;
  /** How solid its glass is, as a share of the usual (the process's gates grow lighter). */
  weight?: number;
}

const ARCH_EVENTS: readonly Pick<Event, "lattice" | "parting" | "from" | "to">[] = [
  { lattice: 0, parting: "split", from: 9, to: 2.8 },
  { lattice: 1, parting: "rise", from: 9.5, to: 3.2 },
  { lattice: 2, parting: "mixed", from: 8.5, to: 2.6 },
  { lattice: 3, parting: "split", from: 10, to: 3.4 },
  { lattice: 1, parting: "mixed", from: 9, to: 2.8 },
  { lattice: 2, parting: "rise", from: 9.5, to: 3 },
  { lattice: 0, parting: "split", from: 10, to: 3.2 },
];

/** Arch by arch: which lattice, how it parts, and when; then the large doorway at the corridor's end. */
const EVENTS: readonly Event[] = [
  ...ARCH_EVENTS.map(
    (event, i): Event => ({
      ...event,
      sigma: ARCHES[i],
      size: "arch",
      fadeNear: 14,
      fadeFar: 22,
      halo: SIGNATURES[i].colour,
      haloSize: 7,
    })
  ),
  // The large lattice doorway: seen from far down the corridor, as the light of the room beyond it begins to arrive, and
  // parted slowly, both leaves into the walls, as the camera comes up to it.
  { sigma: DOOR_SIGMA, lattice: 4, parting: "split", from: 14, to: 3.6, size: "door", fadeNear: 26, fadeFar: 40, halo: "#ffe6c4", haloSize: 11 },
  // The process's gates: each a little thinner than the last, parting slowly while its words are read, the last all but open.
  ...GATES.map(
    (sigma, i): Event => ({
      sigma,
      lattice: 5 + i,
      parting: "split",
      from: 11,
      to: 3.2,
      size: "door",
      fadeNear: 14,
      fadeFar: 24,
      halo: ["#ffe3bf", "#ffe8cc", "#ffeed8", "#fff3e4", "#fffaf0"][i],
      haloSize: 11,
      weight: [0.95, 0.8, 0.62, 0.45, 0.28][i],
    })
  ),
];

type OpeningSize = Event["size"];

/** The two sizes of opening: inside a rib, and the large doorway. */
const OPENINGS: Record<OpeningSize, { width: number; straight: number }> = {
  arch: { width: HALL.width - 0.7, straight: HALL.straight },
  door: { width: BIG_DOOR.width, straight: BIG_DOOR.straight },
};
const FRONT_OPACITY = 0.78;
const BACK_OPACITY = 0.42;
/** How far a leaf must go to be out of sight: into the wall beside the opening, or into the vault above it. */
const slideOf = (size: OpeningSize) => OPENINGS[size].width / 2 + 0.35;
const liftOf = (size: OpeningSize) => OPENINGS[size].straight + OPENINGS[size].width / 2 + 0.5 + (size === "door" ? 1.5 : 0);
/** The rib is 0.34 m thick, extruded towards the viewer from its back face: the veil sits in its middle. */
const RIB_MIDDLE = 0.17;

const smooth = (t: number) => t * t * (3 - 2 * t);
const part = (open: number, start: number) => smooth(Math.min(1, Math.max(0, (open - start) / (1 - start))));

interface ArchVeilsProps {
  materials: Materials;
  jaliMask: Texture;
  glow: Texture;
  lite: boolean;
}

interface VeilRefs {
  group: Group | null;
  left: Group | null;
  right: Group | null;
  halo: MeshBasicMaterial | null;
}

export function ArchVeils({ materials, jaliMask, glow, lite }: ArchVeilsProps) {
  const veils = useRef<VeilRefs[]>(EVENTS.map(() => ({ group: null, left: null, right: null, halo: null })));

  const parts = useMemo(() => {
    const segments = lite ? 24 : 40;
    // The fainter lattice behind: the same leaf, its pattern shifted half a cell so the two slide against each other.
    const shifted = (geometry: ShapeGeometry) => {
      const copy = geometry.clone();
      const uv = copy.getAttribute("uv") as BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) + 0.5, uv.getY(i) + 0.5);
      return copy;
    };
    const make = (size: OpeningSize) => {
      const opening = OPENINGS[size];
      const width = opening.width + 0.04; // a hair over the opening, so the leaves tuck into the rib and no light shows round them
      const leftGeometry = new ShapeGeometry(archLeaf(width, opening.straight, SCREEN_GAP, -1), segments);
      const rightGeometry = new ShapeGeometry(archLeaf(width, opening.straight, SCREEN_GAP, 1), segments);
      return { leftGeometry, rightGeometry, leftBack: lite ? null : shifted(leftGeometry), rightBack: lite ? null : shifted(rightGeometry) };
    };
    const geometries = { arch: make("arch"), door: make("door") };

    // One pattern texture per lattice (arches with the same lattice share it), and a pair of glass materials per arch,
    // so each arch fades and parts on its own.
    const masks = LATTICES.map((lattice) => {
      const mask = jaliMask.clone();
      mask.needsUpdate = true;
      mask.center.set(0.5, 0.5);
      mask.rotation = lattice.angle;
      mask.repeat.set(1 / lattice.cell, 1 / lattice.cell);
      return mask;
    });
    const glasses = EVENTS.map((event) => {
      const lattice = LATTICES[event.lattice];
      const make = (source: MeshPhongMaterial) => {
        const material: MeshPhongMaterial = source.clone();
        material.alphaMap = masks[event.lattice];
        material.color = new Color(lattice.colour);
        material.emissive = new Color(lattice.emissive);
        material.fog = false;
        return material;
      };
      return { front: make(materials.glass), back: make(materials.glassBack) };
    });
    return { geometries, masks, glasses };
  }, [materials, jaliMask, lite]);

  useEffect(
    () => () => {
      for (const mask of parts.masks) mask.dispose();
      for (const { front, back } of parts.glasses) {
        front.dispose();
        back.dispose();
      }
      for (const geometry of Object.values(parts.geometries)) {
        geometry.leftGeometry.dispose();
        geometry.rightGeometry.dispose();
        geometry.leftBack?.dispose();
        geometry.rightBack?.dispose();
      }
    },
    [parts]
  );

  const colours = useMemo(() => EVENTS.map((event) => new Color(event.halo)), []);

  useFrame(() => {
    const cameraZ = stageState.camera.z;
    for (let i = 0; i < EVENTS.length; i++) {
      const refs = veils.current[i];
      const event = EVENTS[i];
      const z = zAt(event.sigma) + RIB_MIDDLE;
      const { fade, open } = veilAt(cameraZ - z, event.from, event.to, event.fadeNear, event.fadeFar);
      const visible = fade > 0.004 && open < 0.998;
      if (refs.group) refs.group.visible = visible;
      if (refs.halo) {
        // Light spills through as the veil parts: a little while it is closed, most as it opens, and none once it has gone.
        const bell = 4 * open * (1 - open);
        refs.halo.opacity = fade * (0.06 + 0.5 * bell);
      }
      if (!visible) continue;
      const glass = parts.glasses[i];
      const shown = fade * (1 - open * open);
      const weight = event.weight ?? 1;
      glass.front.opacity = FRONT_OPACITY * shown * weight;
      glass.back.opacity = lite ? 0 : BACK_OPACITY * shown * weight;

      if (refs.left && refs.right) {
        const SLIDE = slideOf(event.size);
        const LIFT = liftOf(event.size);
        if (event.parting === "split") {
          const o = smooth(open);
          refs.left.position.set(-SLIDE * o, 0, 0);
          refs.right.position.set(SLIDE * o, 0, 0);
        } else if (event.parting === "rise") {
          // The two halves lift into the vault, the right a beat behind the left.
          refs.left.position.set(0, LIFT * part(open, 0), 0);
          refs.right.position.set(0, LIFT * part(open, 0.22), 0);
        } else {
          // One slides aside, the other lifts away.
          refs.left.position.set(-SLIDE * smooth(open), 0, 0);
          refs.right.position.set(0, LIFT * part(open, 0.15), 0);
        }
      }
    }
  });

  return (
    <>
      {EVENTS.map((event, i) => {
        const glass = parts.glasses[i];
        const geometry = parts.geometries[event.size];
        const z = zAt(event.sigma) + RIB_MIDDLE;
        return (
          <group
            key={event.sigma}
            ref={(group) => {
              veils.current[i].group = group;
            }}
            position={[PORTAL.x, 0, z]}
            visible={false}
          >
            <group
              ref={(group) => {
                veils.current[i].left = group;
              }}
            >
              <mesh geometry={geometry.leftGeometry} material={glass.front} renderOrder={2} />
              {geometry.leftBack && <mesh geometry={geometry.leftBack} material={glass.back} position={[0, 0, -0.08]} renderOrder={1} />}
            </group>
            <group
              ref={(group) => {
                veils.current[i].right = group;
              }}
            >
              <mesh geometry={geometry.rightGeometry} material={glass.front} renderOrder={2} />
              {geometry.rightBack && <mesh geometry={geometry.rightBack} material={glass.back} position={[0, 0, -0.08]} renderOrder={1} />}
            </group>
            {/* The arch's own light, spilling through the lattice behind it. */}
            <mesh position={[0, 2.7, -0.3]} renderOrder={0}>
              <planeGeometry args={[event.haloSize, event.haloSize]} />
              <meshBasicMaterial
                ref={(material) => {
                  veils.current[i].halo = material;
                }}
                map={glow}
                color={colours[i]}
                opacity={0}
                transparent
                blending={AdditiveBlending}
                depthWrite={false}
                fog={false}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
