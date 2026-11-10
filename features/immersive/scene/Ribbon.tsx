"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Mesh, Vector3 } from "three";
import type { Materials } from "@/features/immersive/lib/materials";
import { createSoftBandTexture } from "@/features/immersive/lib/textures";
import { WALL, ribbonCurve, smoothstep } from "@/features/immersive/lib/world";
import { POSTER_TIME } from "@/features/immersive/lib/stage-state";

const HALF_WIDTH = 0.3;
/** How far the strip bows across its width. A flat mirror reflects one colour; a gently bowed one reflects a gradient, which is what makes it read as polished metal. */
const CAMBER = 0.09;
/** Vertices across the width of each face. */
const ACROSS = 7;
const UP = new Vector3(0, 1, 0);

interface RibbonProps {
  materials: Materials;
  segments: number;
  /** Draw every frame (false) or every other frame (true). The ribbon moves slowly, so half the rate is invisible. */
  halfRate: boolean;
  /** Freeze the motion at its starting moment (used when rendering the fallback pictures). */
  frozen: boolean;
}

/**
 * The ribbon: a long, thin strip of mirror chrome that is the spine of the whole piece.
 *
 * Its route is fixed (the curve in lib/world.ts); what moves is how it turns and sways along that route.
 * Twist travels down its length like a slow wave, so it catches the studio's lights in turn: flat to the
 * viewer it reflects one softbox, edge-on a hairline, turned over a different light. A gentle sideways sway
 * keeps it alive, and it holds perfectly still where it passes through the screen so it never touches it.
 *
 * It is rebuilt on the CPU each frame (a few thousand vertices, well under a millisecond) because the shape
 * depends on time and on nothing the graphics card could do more cheaply without extra code to compile.
 * A soft shadow on the gallery floor, drawn from the same numbers, ties it to the room.
 */
export function Ribbon({ materials, segments, halfRate, frozen }: RibbonProps) {
  const meshRef = useRef<Mesh>(null);
  const shadowRef = useRef<Mesh>(null);
  const frame = useRef(0);

  const rig = useMemo(() => {
    const count = segments + 1;
    const length = ribbonCurve.getLength();

    const points = ribbonCurve.getSpacedPoints(segments);
    const tangents = points.map((_, i) => ribbonCurve.getTangentAt(i / segments));
    const widthAxis = tangents.map((t) => new Vector3().crossVectors(UP, t).normalize());
    const normalAxis = tangents.map((t, i) => new Vector3().crossVectors(t, widthAxis[i]).normalize());

    // Ribbon: each ring is a lens-shaped cross-section, a bowed top face and a bowed bottom face meeting at
    // the two edges, with ACROSS vertices on each so the bow shades smoothly.
    const ring = ACROSS * 2;
    const positions = new Float32Array(count * ring * 3);
    const normals = new Float32Array(count * ring * 3);
    const indices: number[] = [];
    for (let i = 0; i < count - 1; i++) {
      for (let face = 0; face < 2; face++) {
        for (let k = 0; k < ACROSS - 1; k++) {
          const a = i * ring + face * ACROSS + k;
          const b = a + 1;
          const c = a + ring;
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }
    }
    const geometry = new BufferGeometry();
    const positionAttribute = new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage);
    const normalAttribute = new BufferAttribute(normals, 3).setUsage(DynamicDrawUsage);
    geometry.setAttribute("position", positionAttribute);
    geometry.setAttribute("normal", normalAttribute);
    geometry.setIndex(indices);

    // Shadow: a flat strip, 2 vertices per ring, with the soft band as its alpha across the width.
    const shadowPositions = new Float32Array(count * 2 * 3);
    const shadowUv = new Float32Array(count * 2 * 2);
    const shadowIndices: number[] = [];
    for (let i = 0; i < count; i++) {
      shadowUv.set([0, i / segments, 1, i / segments], i * 4);
      if (i < count - 1) {
        const a = i * 2;
        shadowIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const shadowGeometry = new BufferGeometry();
    const shadowAttribute = new BufferAttribute(shadowPositions, 3).setUsage(DynamicDrawUsage);
    shadowGeometry.setAttribute("position", shadowAttribute);
    shadowGeometry.setAttribute("uv", new BufferAttribute(shadowUv, 2));
    shadowGeometry.setIndex(shadowIndices);

    // How much each sample may sway: none where it threads the screen, full elsewhere.
    const sway = points.map((p) => 1 - Math.exp(-(((p.z - (WALL.z - 0.6)) / 2.2) ** 2)));

    return {
      count,
      length,
      points,
      tangents,
      widthAxis,
      normalAxis,
      sway,
      geometry,
      positions,
      normals,
      positionAttribute,
      normalAttribute,
      shadowGeometry,
      shadowPositions,
      shadowAttribute,
    };
  }, [segments]);

  const shadowMaterial = useMemo(() => {
    const band = createSoftBandTexture();
    return { band };
  }, []);

  const scratch = useMemo(() => ({ w: new Vector3(), n: new Vector3(), c: new Vector3() }), []);

  useFrame((state) => {
    frame.current += 1;
    if (halfRate && frame.current % 2 === 0) return;
    const t = frozen ? POSTER_TIME : POSTER_TIME + state.clock.elapsedTime;
    const { count, length, points, tangents, widthAxis, normalAxis, sway, positions, normals, shadowPositions } = rig;
    const { w, n, c } = scratch;

    for (let i = 0; i < count; i++) {
      const s = (i / (count - 1)) * length;
      const theta = 0.9 + 1.35 * Math.sin(0.36 * s - 0.42 * t) + 0.12 * s;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const W0 = widthAxis[i];
      const N0 = normalAxis[i];

      w.set(W0.x * cos + N0.x * sin, W0.y * cos + N0.y * sin, W0.z * cos + N0.z * sin);
      n.set(-W0.x * sin + N0.x * cos, -W0.y * sin + N0.y * cos, -W0.z * sin + N0.z * cos);

      const sideways = 0.24 * sway[i] * Math.sin(0.55 * s - 0.8 * t);
      const lift = 0.14 * sway[i] * Math.sin(0.37 * s - 0.6 * t + 1.3);
      c.set(
        points[i].x + W0.x * sideways + N0.x * lift,
        points[i].y + W0.y * sideways + N0.y * lift,
        points[i].z + W0.z * sideways + N0.z * lift
      );

      // It narrows to a point over its last stretch, so it dissolves into the light at the end of the hall.
      const hw = HALF_WIDTH * (1 - 0.94 * smoothstep(length - 13, length, s));
      for (let face = 0; face < 2; face++) {
        const flip = face === 0 ? 1 : -1; // the top bows towards +n, the bottom towards -n
        for (let k = 0; k < ACROSS; k++) {
          const u = -1 + (2 * k) / (ACROSS - 1);
          const bulge = CAMBER * (1 - u * u) * flip;
          const lean = (2 * CAMBER * u) / hw;
          const base = (i * ACROSS * 2 + face * ACROSS + k) * 3;
          positions[base] = c.x + w.x * hw * u + n.x * bulge;
          positions[base + 1] = c.y + w.y * hw * u + n.y * bulge;
          positions[base + 2] = c.z + w.z * hw * u + n.z * bulge;
          const nx = n.x * flip + w.x * lean;
          const ny = n.y * flip + w.y * lean;
          const nz = n.z * flip + w.z * lean;
          const inv = 1 / Math.hypot(nx, ny, nz);
          normals[base] = nx * inv;
          normals[base + 1] = ny * inv;
          normals[base + 2] = nz * inv;
        }
      }

      // Shadow on the gallery floor, only in front of the wall.
      const sb = i * 6;
      if (c.z > WALL.z + 0.2) {
        const h = Math.max(0, c.y);
        const tx = tangents[i].x;
        const tz = tangents[i].z;
        const planLength = Math.hypot(tx, tz) || 1;
        const px = -tz / planLength;
        const pz = tx / planLength;
        const across = Math.abs(w.x * px + w.z * pz);
        const half = hw * across + 0.1 + 0.2 * h;
        const x = c.x + 0.42 * h;
        const z = c.z - 0.24 * h;
        shadowPositions[sb] = x + px * half;
        shadowPositions[sb + 1] = 0.014;
        shadowPositions[sb + 2] = z + pz * half;
        shadowPositions[sb + 3] = x - px * half;
        shadowPositions[sb + 4] = 0.014;
        shadowPositions[sb + 5] = z - pz * half;
      } else {
        shadowPositions[sb] = shadowPositions[sb + 3] = c.x;
        shadowPositions[sb + 1] = shadowPositions[sb + 4] = 0.014;
        shadowPositions[sb + 2] = shadowPositions[sb + 5] = c.z;
      }
    }

    rig.positionAttribute.needsUpdate = true;
    rig.normalAttribute.needsUpdate = true;
    rig.shadowAttribute.needsUpdate = true;
  });

  return (
    <>
      <mesh ref={meshRef} geometry={rig.geometry} material={materials.chrome} frustumCulled={false} />
      <mesh ref={shadowRef} geometry={rig.shadowGeometry} frustumCulled={false} renderOrder={1}>
        <meshBasicMaterial
          color="#2a1230"
          transparent
          opacity={0.16}
          alphaMap={shadowMaterial.band}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          side={2}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
