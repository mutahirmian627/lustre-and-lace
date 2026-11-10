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
import { WORK_STOPS, WORK_REACH } from "@/features/immersive/lib/timeline";
import { zAt } from "@/features/immersive/lib/world";

/**
 * The exhibition: the demo store, which is the studio's one finished project, hung on the ivory hall's right wall as
 * real screenshots in ivory frames (two pages of the store, then two phones), and beyond them an empty arch, lit like an
 * exhibit and left empty on purpose: "Next exhibit: yours". Nothing here is invented; the pictures are the store's own
 * screens (public/agency), the same ones the studio's Work page uses.
 *
 * The pictures are fetched only once the visitor is well down the corridor, so none of it costs the opening anything.
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

const BROWSER = { width: 4, height: 2.5, y: 2.35 } as const;
const PHONE = { width: 1.15, height: 2.49, y: 2.3 } as const;
/** The works hang where the camera's stops look: each stop's σ plus the reach. */
const [A, B, C, D] = WORK_STOPS.map((stop) => stop + WORK_REACH);

const WORKS: readonly Work[] = [
  { src: "/agency/store-category.jpg", sigma: A, ...BROWSER },
  { src: "/agency/store-product.jpg", sigma: B, ...BROWSER },
  { src: "/agency/store-mobile.jpg", sigma: C - 0.9, ...PHONE },
  { src: "/agency/store-mobile-product.jpg", sigma: C + 0.7, ...PHONE },
];
/** The empty arch: where the next exhibit will hang. */
const NICHE = { sigma: D, width: 2.3, straight: 2.3, sill: 0.95 } as const;
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
  const started = useRef(false);

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

  // Fetch the screenshots once the visitor is well down the corridor (or at once, for a still).
  useFrame(() => {
    if (started.current || (!frozen && stageState.sigma < 40)) return;
    started.current = true;
    const loader = new TextureLoader();
    WORKS.forEach((work, i) => {
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
        <group key={work.src} position={hang(work.sigma)} rotation={facing}>
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
