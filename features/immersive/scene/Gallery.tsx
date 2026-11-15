"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  ExtrudeGeometry,
  MeshBasicMaterial,
  Path,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from "three";
import { archRing, archShape } from "@/features/immersive/lib/arch";
import { WALL_X } from "@/features/immersive/lib/gallery";
import type { Materials } from "@/features/immersive/lib/materials";
import { stageState } from "@/features/immersive/lib/stage-state";
import { WORK_REACH, WORK_STOPS } from "@/features/immersive/lib/timeline";
import { zAt } from "@/features/immersive/lib/world";
import { WORK_STOPS_DATA } from "@/features/immersive/work";

/**
 * The exhibition: the studio's work hung on the ivory hall's right wall as real screenshots in ivory frames, a stop at a
 * time (see features/immersive/work.ts for what hangs where), and at the end an empty arch, lit like an exhibit and left
 * empty on purpose: "Next exhibit: yours". Nothing here is invented; the pictures are the projects' own screens.
 *
 * Each project's pictures are fetched only once the visitor is well down the hall towards them, so none of it costs the
 * opening anything, and a visitor who stops early never downloads the rest.
 */

interface Work {
  src: string;
  /** Where it hangs along the hall (σ) and its size in metres. */
  sigma: number;
  width: number;
  height: number;
  /** Height of its centre above the floor. */
  y: number;
}

const SIZES = {
  browser: { width: 4, height: 2.5, y: 2.35 },
  phone: { width: 1.15, height: 2.49, y: 2.3 },
} as const;
/** The space left between two frames of one stop. */
const GAP = 0.5;
/** How much smaller a window and a phone are hung when they share a stop. */
const PAIR_SCALE = 0.85;
/** How far (metres along the hall) ahead of a frame the visitor must be before its picture is fetched. */
const FETCH_AHEAD = 45;

/**
 * The frames of every stop, centred on the work the camera looks at (the stop's σ plus the reach). The first frame is the
 * visitor's leftmost as they face the wall, which is the one furthest down the hall.
 */
const WORKS: readonly Work[] = WORK_STOPS_DATA.flatMap((stop, i) => {
  const centre = WORK_STOPS[i] + WORK_REACH;
  // A window and a phone hung together are a little smaller, so the pair fits the view beside the words.
  const kinds = new Set(stop.frames.map((frame) => frame.kind));
  const scale = kinds.has("browser") && kinds.has("phone") ? PAIR_SCALE : 1;
  const widths = stop.frames.map((frame) => SIZES[frame.kind].width * scale);
  const total = widths.reduce((sum, w) => sum + w, 0) + GAP * Math.max(0, widths.length - 1);
  let edge = centre + total / 2;
  return stop.frames.map((frame) => {
    const size = SIZES[frame.kind];
    const width = size.width * scale;
    const sigma = edge - width / 2;
    edge -= width + GAP;
    return { src: frame.src, sigma, width, height: size.height * scale, y: size.y };
  });
});

/** The empty arch: where the next exhibit will hang (the exhibition's last stop). */
const NICHE_STOP = WORK_STOPS_DATA.findIndex((stop) => stop.words.type === "next");
const NICHE = { sigma: WORK_STOPS[NICHE_STOP] + WORK_REACH, width: 2.3, straight: 2.3, sill: 0.95 } as const;
const BORDER = 0.1;

/** A rectangular frame: an outer rectangle with a rectangular hole. */
function rectRing(width: number, height: number, border: number) {
  const outer = new Shape();
  const ow = width / 2 + border;
  const oh = height / 2 + border;
  outer.moveTo(-ow, -oh);
  outer.lineTo(ow, -oh);
  outer.lineTo(ow, oh);
  outer.lineTo(-ow, oh);
  outer.lineTo(-ow, -oh);
  const hole = new Path();
  hole.moveTo(-width / 2, -height / 2);
  hole.lineTo(-width / 2, height / 2);
  hole.lineTo(width / 2, height / 2);
  hole.lineTo(width / 2, -height / 2);
  hole.lineTo(-width / 2, -height / 2);
  outer.holes.push(hole);
  return outer;
}

interface GalleryProps {
  materials: Materials;
  jaliMask: Texture;
  glow: Texture;
  lite: boolean;
  /** Rendering a still for the fallback pictures: fetch the screenshots straight away. */
  frozen: boolean;
}

export function Gallery({ materials, jaliMask, glow, lite, frozen }: GalleryProps) {
  const requested = useRef(new Set<number>());

  const parts = useMemo(() => {
    const frames = new Map<string, ExtrudeGeometry>();
    const frameFor = (work: Work) => {
      const key = `${work.width}x${work.height}`;
      let geometry = frames.get(key);
      if (!geometry) {
        geometry = new ExtrudeGeometry(rectRing(work.width, work.height, BORDER), { depth: 0.07, bevelEnabled: false });
        frames.set(key, geometry);
      }
      return geometry;
    };
    const planes = new Map<string, PlaneGeometry>();
    const planeFor = (work: Work) => {
      const key = `${work.width}x${work.height}`;
      let geometry = planes.get(key);
      if (!geometry) {
        geometry = new PlaneGeometry(work.width, work.height);
        planes.set(key, geometry);
      }
      return geometry;
    };

    const frameMaterial = materials.ceramic.clone();
    // Until its screenshot arrives, a picture is a pale ivory panel.
    const pictures = WORKS.map(() => new MeshBasicMaterial({ color: "#e8e0d2", toneMapped: false, fog: false }));
    const washMaterial = new MeshBasicMaterial({ map: glow, color: "#ffe7c8", opacity: 0.4, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });

    // The empty arch: warm light behind a faint lattice, framed like the lattice windows.
    const nicheShape = new ShapeGeometry(archShape(NICHE.width, NICHE.straight), lite ? 24 : 44);
    const nicheFrame = new ExtrudeGeometry(archRing(NICHE.width + 0.3, NICHE.straight + 0.06, NICHE.width, NICHE.straight), { depth: 0.07, bevelEnabled: false, curveSegments: lite ? 24 : 44 });
    const nicheGlass = new MeshBasicMaterial({ color: "#fff0d8", fog: false, toneMapped: false });
    const bars = jaliMask.clone();
    bars.needsUpdate = true;
    bars.repeat.set(1 / 0.5, 1 / 0.5);
    const nicheBars = new MeshBasicMaterial({ color: "#b79f84", alphaMap: bars, transparent: true, opacity: 0.55, depthWrite: false, fog: false, toneMapped: false, side: DoubleSide });
    return { frameFor, planeFor, frames, planes, frameMaterial, pictures, washMaterial, nicheShape, nicheFrame, nicheGlass, nicheBars, bars };
  }, [materials, jaliMask, glow, lite]);

  // Fetch each picture once the visitor is well down the hall towards it (or all at once, for a still).
  const loader = useMemo(() => new TextureLoader(), []);
  useFrame(() => {
    if (requested.current.size === WORKS.length) return;
    WORKS.forEach((work, i) => {
      if (requested.current.has(i)) return;
      if (!frozen && stageState.sigma < work.sigma - FETCH_AHEAD) return;
      requested.current.add(i);
      loader.load(work.src, (texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = lite ? 4 : 8;
        const material = parts.pictures[i];
        material.map = texture;
        material.color.set("#ffffff");
        material.needsUpdate = true;
      });
    });
  });

  useEffect(
    () => () => {
      for (const material of parts.pictures) {
        material.map?.dispose();
        material.dispose();
      }
      parts.frames.forEach((geometry) => geometry.dispose());
      parts.planes.forEach((geometry) => geometry.dispose());
      parts.bars.dispose();
    },
    [parts]
  );

  const hang = (sigma: number): [number, number, number] => [WALL_X - 0.02, 0, zAt(sigma)];
  // Local +z of a group turned by -90 degrees about y is the hall's -x: out of the wall, into the room.
  const facing: [number, number, number] = [0, -Math.PI / 2, 0];

  return (
    <group>
      {WORKS.map((work, i) => (
        <group key={`${work.src}-${i}`} position={hang(work.sigma)} rotation={facing}>
          {/* The wall washed in warm light round the work. */}
          <mesh material={parts.washMaterial} position={[0, work.y, 0.012]} renderOrder={0}>
            <planeGeometry args={[work.width + 3.4, work.height + 2.6]} />
          </mesh>
          <group position={[0, work.y, 0]}>
            <mesh geometry={parts.frameFor(work)} material={parts.frameMaterial} />
            <mesh geometry={parts.planeFor(work)} material={parts.pictures[i]} position={[0, 0, 0.072]} />
          </group>
        </group>
      ))}

      {/* The next exhibit: an empty arch, lit and waiting. */}
      <group position={hang(NICHE.sigma)} rotation={facing}>
        <mesh material={parts.washMaterial} position={[0, 2.6, 0.012]} renderOrder={0}>
          <planeGeometry args={[5.6, 6]} />
        </mesh>
        <group position={[0, NICHE.sill, 0]}>
          <mesh geometry={parts.nicheShape} material={parts.nicheGlass} position={[0, 0, 0.01]} />
          <mesh geometry={parts.nicheShape} material={parts.nicheBars} position={[0, 0, 0.022]} renderOrder={1} />
          <mesh geometry={parts.nicheFrame} material={parts.frameMaterial} position={[0, -0.03, 0]} />
        </group>
      </group>
    </group>
  );
}
