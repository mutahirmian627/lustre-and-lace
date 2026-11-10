"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Mesh, Vector3 } from "three";
import type { Materials } from "@/features/immersive/lib/materials";
import { createSoftBandTexture } from "@/features/immersive/lib/textures";
import { WALL, ribbonCurve, smoothstep, zAt } from "@/features/immersive/lib/world";
import { ARCHES, DOOR_SIGMA, GATES } from "@/features/immersive/lib/timeline";
import { POSTER_TIME, stageState } from "@/features/immersive/lib/stage-state";

const HALF_WIDTH = 0.3;
/** How far the strip bows across its width. A flat mirror reflects one colour; a gently bowed one reflects a gradient, which is what makes it read as polished metal. */
const CAMBER = 0.09;
/** Vertices across the width of each face. */
const ACROSS = 7;
const UP = new Vector3(0, 1, 0);

/**
 * How far the ribbon swings, in metres, in each bay of the corridor (from the second service arch on; the approved
 * opening's stretch is left exactly as it was). Sideways; it also swings up and down by 40% of this.
 */
const BAY_SWING = [1.6, 1.9, 1.7, 2.0, 1.7, 1.5, 0, 1.2, 1.2, 1.2, 1.2];

/**
 * The ribbon keeps at least this far (centre line, metres) from the camera, so the lens can never pass through it.
 * Below the ribbon's own half-width plus the camera's near plane there is no clearing it, so this is deliberately
 * small: close passes are wanted, and the route is adjusted only to prevent actually going through the geometry.
 */
const LENS_GUARD = 0.42;

/** Beyond this z the floor is the ivory hall's, and the ribbon throws a soft shadow on it, as it does in the gallery. */
const IVORY_FLOOR_Z = zAt(DOOR_SIGMA) - 0.3;

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

    // The weave: down the corridor the ribbon swings like a rope threaded through the arches. Its swing is nil at every
    // arch plane (so it always goes through the opening, in the middle) and greatest mid-bay. The bay a sample is in,
    // and how far across it, is fixed by where it is on the route, so this is computed once.
    const nodes = [...ARCHES.map(zAt), zAt(DOOR_SIGMA), ...GATES.map(zAt)]; // z of each arch, the corridor's end, then each gate (descending)
    const weaveSideways = new Float32Array(count);
    const weaveVertical = new Float32Array(count);
    const weaveBay = new Float32Array(count);
    points.forEach((p, i) => {
      for (let k = 1; k < nodes.length - 1; k++) {
        if (p.z <= nodes[k] && p.z > nodes[k + 1]) {
          const across = (nodes[k] - p.z) / (nodes[k] - nodes[k + 1]);
          const swing = BAY_SWING[k - 1] * Math.sin(Math.PI * across);
          weaveSideways[i] = swing;
          weaveVertical[i] = swing * 0.45;
          weaveBay[i] = k;
        }
      }
    });

    return {
      count,
      length,
      points,
      tangents,
      widthAxis,
      normalAxis,
      sway,
      weaveSideways,
      weaveVertical,
      weaveBay,
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
    const { count, length, points, tangents, widthAxis, normalAxis, sway, weaveSideways, weaveVertical, weaveBay, positions, normals, shadowPositions } = rig;
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

      // The approved sway, then the corridor's weave on top: a wave that runs down the ribbon on the clock (0.7 rad/s,
      // about 1.4 m/s along it) between nodes at the arches, so the bends travel through the openings by themselves.
      const sideways = 0.24 * sway[i] * Math.sin(0.55 * s - 0.8 * t) + weaveSideways[i] * Math.sin(0.7 * t - 0.5 * s + 0.9 * weaveBay[i]);
      const lift = 0.14 * sway[i] * Math.sin(0.37 * s - 0.6 * t + 1.3) + weaveVertical[i] * Math.sin(0.55 * t - 0.4 * s + 2.1 + 0.7 * weaveBay[i]);
      c.set(
        points[i].x + W0.x * sideways + N0.x * lift,
        points[i].y + W0.y * sideways + N0.y * lift,
        points[i].z + W0.z * sideways + N0.z * lift
      );

      // Only if the camera is about to pass through it, ease the ribbon aside.
      const dx = c.x - stageState.camera.x;
      const dy = c.y - stageState.camera.y;
      const dz = c.z - stageState.camera.z;
      const gap = Math.hypot(dx, dy, dz);
      if (gap < LENS_GUARD && gap > 0.001) {
        const push = ((LENS_GUARD - gap) * 0.9) / gap;
        c.x += dx * push;
        c.y += dy * push;
        c.z += dz * push;
      }

      // Its last few metres narrow a little, to a finer end where it touches the floor of the ivory hall.
      const hw = HALF_WIDTH * (1 - 0.5 * smoothstep(length - 6, length, s));
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

      // Shadow on the floor: in the gallery in front of the wall, and in the ivory hall beyond the large doorway.
      const sb = i * 6;
      if (c.z > WALL.z + 0.2 || c.z < IVORY_FLOOR_Z) {
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
