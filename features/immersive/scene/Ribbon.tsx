"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Vector3 } from "three";
import type { Materials } from "@/features/immersive/lib/materials";
import { RIBBON_ARCH_ARCS, RIBBON_LENGTH, RIBBON_STEP, ribbonArcAt, ribbonTable } from "@/features/immersive/lib/ribbon-path";
import { createSoftBandTexture } from "@/features/immersive/lib/textures";
import { clamp01, smoothstep } from "@/features/immersive/lib/timeline";
import { WALL } from "@/features/immersive/lib/world";
import { POSTER_TIME, stageState } from "@/features/immersive/lib/stage-state";

const HALF_WIDTH = 0.3;
/** How far the strip bows across its width. A flat mirror reflects one colour; a gently bowed one reflects a gradient, which is what makes it read as polished metal. */
const CAMBER = 0.09;
/** Vertices across the width of each face. */
const ACROSS = 7;
/** How far ahead of the camera the ribbon's head runs, in the corridor. */
const LEAD = 16;
/** The ribbon keeps at least this far from the camera (metres), easing aside rather than passing through the lens. */
const GIVE_WAY = 3.0;
/** Spacing of the rings along the ribbon, in metres, when the budget allows. */
const RING_SPACING = 0.22;

interface RibbonProps {
  materials: Materials;
  /** The most rings the ribbon may have. */
  segments: number;
  /** Draw every frame (false) or every other frame (true). The ribbon moves slowly, so half the rate is invisible. */
  halfRate: boolean;
  /** Freeze the motion at its starting moment (used when rendering the fallback pictures). */
  frozen: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The ribbon: a long, thin strip of mirror chrome that is the spine of the whole piece, and the visitor's guide.
 *
 * Its route is fixed (lib/ribbon-path.ts); what moves is how it turns and sways along that route, and how much
 * of it is drawn. In the opening the whole ribbon is there, as approved. Once the visitor is in the corridor only
 * a stretch of it is drawn: its head runs about fifteen metres ahead of the camera and narrows to a point, so it
 * seems to draw the way forward as you scroll, and it is never left hanging where you have already been.
 *
 * It is alive in three ways. A slow wave of twist travels down it, so it catches the studio's lights in turn.
 * It sways, more freely in the corridor than in the gallery, on several slow rhythms at once so it never repeats
 * obviously. And it responds to the visitor: it turns over as it passes through each arch, and the faster you scroll
 * the faster it ripples, settling again when you stop.
 *
 * It is rebuilt on the CPU each frame (a few thousand vertices, well under a millisecond). A soft shadow on the
 * gallery floor, drawn from the same numbers, ties it to the room.
 */
export function Ribbon({ materials, segments, halfRate, frozen }: RibbonProps) {
  const frame = useRef(0);
  const time = useRef(POSTER_TIME);

  const rig = useMemo(() => {
    const rings = segments + 1;
    const ringSize = ACROSS * 2;
    const positions = new Float32Array(rings * ringSize * 3);
    const normals = new Float32Array(rings * ringSize * 3);
    const indices: number[] = [];
    for (let i = 0; i < rings - 1; i++) {
      for (let face = 0; face < 2; face++) {
        for (let k = 0; k < ACROSS - 1; k++) {
          const a = i * ringSize + face * ACROSS + k;
          const b = a + 1;
          const c = a + ringSize;
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
    const shadowPositions = new Float32Array(rings * 2 * 3);
    const shadowUv = new Float32Array(rings * 2 * 2);
    const shadowIndices: number[] = [];
    for (let i = 0; i < rings; i++) {
      shadowUv.set([0, i / segments, 1, i / segments], i * 4);
      if (i < rings - 1) {
        const a = i * 2;
        shadowIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const shadowGeometry = new BufferGeometry();
    const shadowAttribute = new BufferAttribute(shadowPositions, 3).setUsage(DynamicDrawUsage);
    shadowGeometry.setAttribute("position", shadowAttribute);
    shadowGeometry.setAttribute("uv", new BufferAttribute(shadowUv, 2));
    shadowGeometry.setIndex(shadowIndices);

    return { rings, positions, normals, positionAttribute, normalAttribute, geometry, shadowGeometry, shadowPositions, shadowAttribute };
  }, [segments]);

  const band = useMemo(() => createSoftBandTexture(), []);
  const scratch = useMemo(
    () => ({ w: new Vector3(), n: new Vector3(), c: new Vector3(), w0: new Vector3(), n0: new Vector3(), p: new Vector3() }),
    []
  );

  useFrame((state, delta) => {
    // Time moves on every frame, faster while the visitor is scrolling quickly.
    if (!frozen) time.current += Math.min(delta, 0.1) * (1 + Math.min(2.5, stageState.speed * 2));
    frame.current += 1;
    if (halfRate && frame.current % 2 === 0) return;

    const t = time.current;
    const g = stageState.value;
    // On a tall (phone) screen the same ribbon would fill far more of the view, so it is slimmer and keeps further away there.
    const tall = state.size.width / state.size.height < 0.85;
    const slim = tall ? 0.6 : 1;
    const keepAway = tall ? GIVE_WAY + 0.9 : GIVE_WAY;
    const { rings, positions, normals, shadowPositions } = rig;
    const { w, n, c, w0, n0, p } = scratch;
    const { position, widthAxis, faceAxis, count } = ribbonTable;

    // Which stretch of the ribbon is drawn. In the opening, all of it. Once the camera is in the corridor, from just behind
    // it to a head fifteen metres ahead; the change happens as the camera goes through the doorway, out of sight.
    const sCamera = ribbonArcAt(stageState.sigma);
    // The head draws in from the far end to its place ahead of the camera as the corridor begins, after the approved opening.
    const toCorridor = smoothstep(1.0, 1.25, g);
    const giveWay = smoothstep(1.0, 1.1, g);
    const sHead = lerp(RIBBON_LENGTH, sCamera + LEAD, toCorridor);
    const sTail = lerp(0, sCamera - 0.3, smoothstep(1.0, 1.15, g));
    const length = sHead - sTail;
    const used = Math.max(24, Math.min(rings, Math.ceil(length / RING_SPACING)));
    const headTaper = Math.min(13, Math.max(5, length * 0.35));
    const tailTaper = sTail > 0.5 ? 1.4 : 0;
    // The first bay stays exactly as the approved opening shows it; the ribbon loosens from the second arch on.
    const corridorStart = RIBBON_ARCH_ARCS[1];
    const corridorEnd = RIBBON_ARCH_ARCS[2];

    for (let i = 0; i < rings; i++) {
      // Rings beyond those in use sit on the last used ring, so they draw nothing.
      const ring = Math.min(i, used - 1);
      const s = sTail + (length * ring) / (used - 1);

      const x = Math.min(count - 2, s / RIBBON_STEP);
      const i0 = Math.max(0, Math.floor(x));
      const f = x - i0;
      const a = i0 * 3;
      const b = a + 3;
      p.set(lerp(position[a], position[b], f), lerp(position[a + 1], position[b + 1], f), lerp(position[a + 2], position[b + 2], f));
      w0.set(lerp(widthAxis[a], widthAxis[b], f), lerp(widthAxis[a + 1], widthAxis[b + 1], f), lerp(widthAxis[a + 2], widthAxis[b + 2], f)).normalize();
      n0.set(lerp(faceAxis[a], faceAxis[b], f), lerp(faceAxis[a + 1], faceAxis[b + 1], f), lerp(faceAxis[a + 2], faceAxis[b + 2], f)).normalize();

      // Twist: a slow wave down the ribbon, plus a half-turn at each arch it threads.
      let theta = 0.9 + 1.35 * Math.sin(0.36 * s - 0.42 * t) + 0.12 * s;
      for (let k = 2; k < RIBBON_ARCH_ARCS.length; k++) {
        const d = (s - RIBBON_ARCH_ARCS[k]) / 1.8;
        if (d > -3 && d < 3) theta += (k % 2 ? 0.8 : -0.8) * Math.exp(-d * d);
      }
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      w.set(w0.x * cos + n0.x * sin, w0.y * cos + n0.y * sin, w0.z * cos + n0.z * sin);
      n.set(-w0.x * sin + n0.x * cos, -w0.y * sin + n0.y * cos, -w0.z * sin + n0.z * cos);

      // Sway: none where it threads the screen, gentle in the gallery, freer in the corridor, on several rhythms at once.
      const gallery = 1 - Math.exp(-(((p.z - (WALL.z - 0.6)) / 2.2) ** 2));
      const corridor = smoothstep(corridorStart, corridorEnd, s);
      const amount = gallery * (1 + 1.1 * corridor);
      const sideways =
        amount * (0.24 * Math.sin(0.55 * s - 0.8 * t) + corridor * 0.12 * Math.sin(1.31 * s - 1.1 * t + 0.7));
      const lift =
        amount * (0.14 * Math.sin(0.37 * s - 0.6 * t + 1.3) + corridor * 0.07 * Math.sin(0.93 * s - 0.9 * t));
      c.set(
        p.x + w0.x * sideways + n0.x * lift,
        p.y + w0.y * sideways + n0.y * lift,
        p.z + w0.z * sideways + n0.z * lift
      );

      // It eases away from the camera if they ever come close, and slims as it nears the lens so it never swamps the view.
      let nearness = 1;
      if (giveWay > 0) {
        const dx = c.x - stageState.camera.x;
        const dy = c.y - stageState.camera.y;
        const dz = c.z - stageState.camera.z;
        const distance = Math.hypot(dx, dy, dz) || 0.001;
        if (distance < keepAway) {
          const push = ((keepAway - distance) * 0.85 * giveWay) / distance;
          c.x += dx * push;
          c.y += dy * push;
          c.z += dz * push;
        }
        nearness = 1 - giveWay * 0.5 * (1 - smoothstep(2.5, 8, distance));
      }

      // It narrows to a point at its head, and (once the camera is inside) at its tail; a little slimmer in the corridor.
      let narrow = (1 - 0.94 * smoothstep(sHead - headTaper, sHead, s)) * (1 - 0.3 * corridor) * nearness;
      if (tailTaper > 0) narrow *= 0.06 + 0.94 * smoothstep(sTail, sTail + tailTaper, s);
      narrow = tall && giveWay > 0 ? narrow * (1 - giveWay * (1 - slim)) : narrow;
      const hw = HALF_WIDTH * narrow;

      for (let face = 0; face < 2; face++) {
        const flip = face === 0 ? 1 : -1; // the top bows towards +n, the bottom towards -n
        for (let k = 0; k < ACROSS; k++) {
          const u = -1 + (2 * k) / (ACROSS - 1);
          const bulge = CAMBER * narrow * (1 - u * u) * flip;
          const lean = (2 * CAMBER * u) / HALF_WIDTH;
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
        // The direction of travel, flat: the ribbon's width axis crossed with its face gives it; the plan-view normal is its perpendicular.
        const tx = w0.y * n0.z - w0.z * n0.y;
        const tz = w0.x * n0.y - w0.y * n0.x;
        const planLength = Math.hypot(tx, tz) || 1;
        const px = -tz / planLength;
        const pz = tx / planLength;
        const across = Math.abs(w.x * px + w.z * pz);
        const half = (hw * across + 0.1 + 0.2 * h) * clamp01(narrow * 2);
        const sx = c.x + 0.42 * h;
        const sz = c.z - 0.24 * h;
        shadowPositions[sb] = sx + px * half;
        shadowPositions[sb + 1] = 0.014;
        shadowPositions[sb + 2] = sz + pz * half;
        shadowPositions[sb + 3] = sx - px * half;
        shadowPositions[sb + 4] = 0.014;
        shadowPositions[sb + 5] = sz - pz * half;
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
      <mesh geometry={rig.geometry} material={materials.chrome} frustumCulled={false} />
      <mesh geometry={rig.shadowGeometry} frustumCulled={false} renderOrder={1}>
        <meshBasicMaterial
          color="#2a1230"
          transparent
          opacity={0.16}
          alphaMap={band}
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
