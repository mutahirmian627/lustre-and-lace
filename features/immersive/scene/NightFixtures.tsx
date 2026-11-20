"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Euler,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Quaternion,
  type Texture,
} from "three";
import { nightChannels, nightState } from "@/features/immersive/lib/night";
import { NIGHT } from "@/features/immersive/lib/night-look";
import { planFixtures, type Lamp, type Pool } from "@/features/immersive/lib/night-fixtures";

const OFF_BAR = new Color("#1c1511");
const CORE = new Color(NIGHT.fixtureCore);
const HALO = new Color(NIGHT.fixtureHalo);
const LAMP = new Color(NIGHT.lamp);
/** The glass of a lit bar: warm gold, never white (white lines read as strip lighting, not as candle-gold). */
const BAR_ON = new Color("#e8b06a");
const scratch = new Color();

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** How lit a fixture is, given how far the change has got (`fixtures`, 0..1) and its place in the wave (`delay`, 0..1). */
export const litness = (fixtures: number, delay: number) => smoothstep(delay * 0.55, delay * 0.55 + 0.45, fixtures);

/** How much each light breathes: a few percent, slowly, no two together, so the lamps feel alive but never flicker. */
const BREATH = 0.035;
export const breath = (time: number, i: number) => 1 + BREATH * Math.sin(time * 0.55 + i * 2.399);

interface Layer {
  points: Points;
  geometry: BufferGeometry;
  material: PointsMaterial;
  lamps: Lamp[];
  colours: Float32Array;
}

/**
 * The lights of "after dark" (see lib/night-fixtures.ts for where they are and why): the lit lines of the building, drawn as
 * a handful of draw calls and nothing else. Points for the lamps and their halos, one instanced mesh of soft planes for the
 * pools of light and the wall washes, one instanced mesh of thin bars for the cove lines and the bodies of the sconces.
 *
 * None of them is a real light (the few real ones are HallLights' lamps and NightLamps): they are the visible side of the
 * lighting, the part the eye reads as "a lamp", and they are additive, so they can never darken anything. In daylight the
 * whole group is hidden and nothing here runs.
 */
export function NightFixtures({ glow, lite, frozen }: { glow: Texture; lite: boolean; frozen: boolean }) {
  const group = useRef<Group>(null);

  const parts = useMemo(() => {
    const plan = planFixtures();
    const lamps = lite ? plan.lamps.filter((lamp) => lamp.size > 0.3) : plan.lamps;

    // Lamps: grouped by size (a Points object has one size), a halo layer and a smaller, brighter core layer for each.
    const sizes = [...new Set(lamps.map((lamp) => lamp.size))];
    const layers: Layer[] = [];
    for (const size of sizes) {
      const these = lamps.filter((lamp) => lamp.size === size);
      for (const kind of ["halo", "core"] as const) {
        const geometry = new BufferGeometry();
        const positions = new Float32Array(these.length * 3);
        these.forEach((lamp, i) => positions.set(lamp.position, i * 3));
        const colours = new Float32Array(these.length * 3);
        geometry.setAttribute("position", new BufferAttribute(positions, 3));
        const colourAttribute = new BufferAttribute(colours, 3);
        colourAttribute.setUsage(DynamicDrawUsage);
        geometry.setAttribute("color", colourAttribute);
        const material = new PointsMaterial({
          map: glow,
          color: kind === "halo" ? HALO : CORE,
          size: kind === "halo" ? size : size * 0.34,
          sizeAttenuation: true,
          vertexColors: true,
          transparent: true,
          blending: AdditiveBlending,
          depthWrite: false,
          fog: false,
        });
        const points = new Points(geometry, material);
        points.frustumCulled = false;
        points.renderOrder = 3;
        layers.push({ points, geometry, material, lamps: these, colours });
      }
    }

    // Pools and washes: one instanced plane each, placed once.
    const pools = plan.pools;
    const poolGeometry = new PlaneGeometry(1, 1);
    const poolMaterial = new MeshBasicMaterial({ map: glow, color: LAMP, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });
    const poolMesh = new InstancedMesh(poolGeometry, poolMaterial, pools.length);
    poolMesh.frustumCulled = false;
    poolMesh.renderOrder = 2;
    const poolColours = new InstancedBufferAttribute(new Float32Array(pools.length * 3), 3);
    poolColours.setUsage(DynamicDrawUsage);
    poolMesh.instanceColor = poolColours;
    const dummy = new Object3D();
    const euler = new Euler();
    const quaternion = new Quaternion();
    pools.forEach((pool, i) => {
      euler.set(pool.facing === "up" ? -Math.PI / 2 : 0, pool.facing === "right" ? Math.PI / 2 : pool.facing === "left" ? -Math.PI / 2 : 0, 0);
      quaternion.setFromEuler(euler);
      dummy.position.set(...pool.position);
      dummy.quaternion.copy(quaternion);
      dummy.scale.set(pool.width, pool.height, 1);
      dummy.updateMatrix();
      poolMesh.setMatrixAt(i, dummy.matrix);
    });
    poolMesh.instanceMatrix.needsUpdate = true;

    // Bars.
    const bars = plan.bars;
    const barGeometry = new BoxGeometry(1, 1, 1);
    const barMaterial = new MeshBasicMaterial({ color: 0xffffff, fog: false, toneMapped: false });
    const barMesh = new InstancedMesh(barGeometry, barMaterial, bars.length);
    barMesh.frustumCulled = false;
    const barColours = new InstancedBufferAttribute(new Float32Array(bars.length * 3), 3);
    barColours.setUsage(DynamicDrawUsage);
    barMesh.instanceColor = barColours;
    dummy.quaternion.identity();
    bars.forEach((bar, i) => {
      dummy.position.set(...bar.position);
      dummy.scale.set(...bar.size);
      dummy.updateMatrix();
      barMesh.setMatrixAt(i, dummy.matrix);
    });
    barMesh.instanceMatrix.needsUpdate = true;

    return { layers, pools, poolGeometry, poolMaterial, poolMesh, poolColours, bars, barGeometry, barMaterial, barMesh, barColours };
  }, [glow, lite]);

  // Put every object in the group once, hidden until after dark begins.
  useEffect(() => {
    const host = group.current;
    if (!host) return;
    const objects = [...parts.layers.map((layer) => layer.points), parts.poolMesh, parts.barMesh];
    host.add(...objects);
    return () => {
      host.remove(...objects);
    };
  }, [parts]);

  useEffect(
    () => () => {
      for (const layer of parts.layers) {
        layer.geometry.dispose();
        layer.material.dispose();
      }
      parts.poolGeometry.dispose();
      parts.poolMaterial.dispose();
      parts.poolMesh.dispose();
      parts.barGeometry.dispose();
      parts.barMaterial.dispose();
      parts.barMesh.dispose();
    },
    [parts]
  );

  // Ask the graphics card to prepare the fixtures' shaders while the visitor is still in daylight and the browser is idle, so
  // that lighting them for the first time is not a stutter in the middle of the change. (They are hidden in daylight, and
  // hidden objects are not prepared, so for the moment of the request they are shown; nothing is drawn in that moment.)
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    const host = group.current;
    if (!host || frozen) return;
    const warm = () => {
      const was = host.visible;
      host.visible = true;
      gl.compileAsync(scene, camera).catch(() => {});
      host.visible = was;
    };
    const handle = window.setTimeout(warm, 2500);
    return () => window.clearTimeout(handle);
  }, [gl, scene, camera, frozen, parts]);

  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const state = useMemo(() => ({ wasOn: false, lastFixtures: -1 }), []);

  useFrame((frame) => {
    const host = group.current;
    if (!host) return;
    const { fixtures } = nightChannels(nightState.value);
    const on = fixtures > 0.0005;
    if (!on) {
      // Daylight: hidden, and nothing to do.
      if (state.wasOn) {
        host.visible = false;
        state.wasOn = false;
      }
      return;
    }
    host.visible = true;
    state.wasOn = true;

    // At rest and fully lit, the lights still breathe (very slightly), unless the visitor asked for stillness.
    const time = frozen || reduced ? 0 : frame.clock.elapsedTime;
    if (state.lastFixtures === fixtures && (frozen || reduced)) return;
    state.lastFixtures = fixtures;

    for (const layer of parts.layers) {
      const attribute = layer.geometry.getAttribute("color") as BufferAttribute;
      layer.lamps.forEach((lamp, i) => {
        const v = litness(fixtures, lamp.delay) * lamp.level * breath(time, i + layer.lamps.length);
        layer.colours[i * 3] = layer.colours[i * 3 + 1] = layer.colours[i * 3 + 2] = v;
      });
      attribute.needsUpdate = true;
    }

    const poolColours = parts.poolColours.array as Float32Array;
    parts.pools.forEach((pool: Pool, i) => {
      const v = litness(fixtures, pool.delay) * pool.level * 0.34 * breath(time, i);
      poolColours[i * 3] = poolColours[i * 3 + 1] = poolColours[i * 3 + 2] = v;
    });
    parts.poolColours.needsUpdate = true;

    const barColours = parts.barColours.array as Float32Array;
    const bar = scratch;
    parts.bars.forEach((fixture, i) => {
      bar.copy(OFF_BAR).lerp(BAR_ON, litness(fixtures, fixture.delay) * breath(time, i + 7));
      barColours[i * 3] = bar.r;
      barColours[i * 3 + 1] = bar.g;
      barColours[i * 3 + 2] = bar.b;
    });
    parts.barColours.needsUpdate = true;
  });

  return <group ref={group} visible={false} />;
}
