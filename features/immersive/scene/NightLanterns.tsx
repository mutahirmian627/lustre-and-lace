"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Vector2,
  type Texture,
} from "three";
import { nightChannels, nightState } from "@/features/immersive/lib/night";
import { planFixtures } from "@/features/immersive/lib/night-fixtures";
import { breath, litness } from "@/features/immersive/scene/NightFixtures";

/**
 * The profile of a fanous, bottom to top (radius, height), for a lantern one unit wide: a small finial, a swelling onion body,
 * a narrow neck with a ring, a crowned dome and a point. Turned on a lathe, it is one closed surface.
 */
const PROFILE: [number, number][] = [
  [0.0, 0.0], [0.035, 0.03], [0.07, 0.08], [0.15, 0.15], [0.215, 0.27], [0.24, 0.41], [0.215, 0.55], [0.15, 0.65],
  [0.095, 0.73], [0.12, 0.765], [0.095, 0.8], [0.15, 0.88], [0.105, 0.99], [0.035, 1.1], [0.0, 1.18],
];
const HEIGHT = 1.18;

const BRASS_ON = new Color("#d8a45e");
const BRASS_OFF = new Color("#3a2a1c");
const CORE_ON = new Color("#ffd28e");
const CHAIN_ON = new Color("#a67c46");
const CHAIN_OFF = new Color("#2a2018");
const PATTERN = new Color("#ffc47a");
const HALO = new Color("#ffb766");
const scratch = new Color();

/**
 * Hanging brass lanterns, the Arabian-nights touch of "after dark" (see lib/night-fixtures.ts for where they hang). Each is a
 * lattice-pierced brass shell around a glowing core, on a chain, swaying a few millimetres; its light lies on the floor below as a
 * lattice of light. The shell reuses the scene's own lattice pattern, so the lanterns belong to the same world as the windows
 * and the veils. All of them are drawn in a few instanced draw calls; none is a real light (the hall's lamps do that work).
 * In daylight the group is hidden and nothing here runs.
 */
export function NightLanterns({ jaliMask, glow, frozen }: { jaliMask: Texture; glow: Texture; frozen: boolean }) {
  const group = useRef<Group>(null);

  const parts = useMemo(() => {
    const lanterns = planFixtures().lanterns;
    const count = lanterns.length;

    const lathe = new LatheGeometry(PROFILE.map(([r, y]) => new Vector2(r, y)), 18);
    const chainGeometry = new CylinderGeometry(0.012, 0.012, 1, 5, 1);
    chainGeometry.translate(0, -0.5, 0); // hangs down from its top
    const patternGeometry = new PlaneGeometry(1, 1);

    // The lattice the shell is pierced with: the same pattern as the windows, fine enough to read on something this small.
    const lattice = jaliMask.clone();
    lattice.needsUpdate = true;
    lattice.repeat.set(7, 4.2);
    const floorLattice = jaliMask.clone();
    floorLattice.needsUpdate = true;
    floorLattice.repeat.set(6, 6);

    const shellMaterial = new MeshBasicMaterial({ color: 0xffffff, alphaMap: lattice, transparent: true, side: DoubleSide, depthWrite: false, fog: false, toneMapped: false });
    const coreMaterial = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide, fog: false, toneMapped: false });
    const chainMaterial = new MeshBasicMaterial({ color: 0xffffff, fog: false, toneMapped: false });
    const patternMaterial = new MeshBasicMaterial({
      map: glow,
      alphaMap: floorLattice,
      color: PATTERN,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });

    const colours = (n: number) => {
      const attribute = new InstancedBufferAttribute(new Float32Array(n * 3), 3);
      attribute.setUsage(DynamicDrawUsage);
      return attribute;
    };
    const shell = new InstancedMesh(lathe, shellMaterial, count);
    const core = new InstancedMesh(lathe, coreMaterial, count);
    const chains = new InstancedMesh(chainGeometry, chainMaterial, count);
    shell.instanceColor = colours(count);
    core.instanceColor = colours(count);
    chains.instanceColor = colours(count);
    shell.renderOrder = 4;
    core.renderOrder = 3;
    chains.renderOrder = 3;
    for (const mesh of [shell, core, chains]) mesh.frustumCulled = false;

    const floor = lanterns.map((lantern, i) => ({ lantern, i })).filter(({ lantern }) => lantern.floorPattern);
    const patterns = new InstancedMesh(patternGeometry, patternMaterial, floor.length);
    patterns.instanceColor = colours(floor.length);
    patterns.frustumCulled = false;
    patterns.renderOrder = 2;
    const dummy = new Object3D();
    floor.forEach(({ lantern }, k) => {
      const size = lantern.scale * 7.5;
      dummy.position.set(lantern.position[0], 0.03, lantern.position[2]);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(size, size, 1);
      dummy.updateMatrix();
      patterns.setMatrixAt(k, dummy.matrix);
    });
    patterns.instanceMatrix.needsUpdate = true;

    // The glow round each lantern: one Points layer per size.
    const sizes = [...new Set(lanterns.map((lantern) => lantern.scale))];
    const halos = sizes.map((scale) => {
      const these = lanterns.map((lantern, i) => ({ lantern, i })).filter(({ lantern }) => lantern.scale === scale);
      const geometry = new BufferGeometry();
      const positions = new Float32Array(these.length * 3);
      these.forEach(({ lantern }, k) => positions.set([lantern.position[0], lantern.position[1] + scale * HEIGHT * 0.38, lantern.position[2]], k * 3));
      geometry.setAttribute("position", new BufferAttribute(positions, 3));
      const colourAttribute = new BufferAttribute(new Float32Array(these.length * 3), 3);
      colourAttribute.setUsage(DynamicDrawUsage);
      geometry.setAttribute("color", colourAttribute);
      const material = new PointsMaterial({
        map: glow,
        color: HALO,
        size: scale * 4.2,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        fog: false,
      });
      const points = new Points(geometry, material);
      points.frustumCulled = false;
      points.renderOrder = 5;
      return { points, geometry, material, these, colourAttribute };
    });

    // The brackets of the wall-mounted ones: thin bars, drawn as a few plain meshes.
    const brackets = lanterns.flatMap((lantern) => (lantern.bracket ? [lantern.bracket] : []));
    const bracketGeometry = new CylinderGeometry(0.5, 0.5, 1, 5, 1);
    const bracketMaterial = new MeshBasicMaterial({ color: CHAIN_ON, fog: false, toneMapped: false });

    return { lanterns, lathe, chainGeometry, patternGeometry, lattice, floorLattice, shellMaterial, coreMaterial, chainMaterial, patternMaterial, shell, core, chains, patterns, floor, halos, brackets, bracketGeometry, bracketMaterial };
  }, [jaliMask, glow]);

  // Put everything in the group, with the brackets as meshes of their own.
  useEffect(() => {
    const host = group.current;
    if (!host) return;
    const bracketMeshes = parts.brackets.map((bar) => {
      const mesh = new InstancedMesh(parts.bracketGeometry, parts.bracketMaterial, 1);
      const dummy = new Object3D();
      dummy.position.set(...bar.position);
      dummy.rotation.set(Math.PI / 2, 0, 0); // along z
      dummy.scale.set(bar.size[0], bar.size[2], bar.size[1]);
      dummy.updateMatrix();
      mesh.setMatrixAt(0, dummy.matrix);
      mesh.frustumCulled = false;
      return mesh;
    });
    const objects = [parts.shell, parts.core, parts.chains, parts.patterns, ...parts.halos.map((halo) => halo.points), ...bracketMeshes];
    host.add(...objects);
    return () => {
      host.remove(...objects);
      bracketMeshes.forEach((mesh) => mesh.dispose());
    };
  }, [parts]);

  useEffect(
    () => () => {
      parts.lathe.dispose();
      parts.chainGeometry.dispose();
      parts.patternGeometry.dispose();
      parts.bracketGeometry.dispose();
      parts.lattice.dispose();
      parts.floorLattice.dispose();
      for (const material of [parts.shellMaterial, parts.coreMaterial, parts.chainMaterial, parts.patternMaterial, parts.bracketMaterial]) material.dispose();
      for (const mesh of [parts.shell, parts.core, parts.chains, parts.patterns]) mesh.dispose();
      for (const halo of parts.halos) {
        halo.geometry.dispose();
        halo.material.dispose();
      }
    },
    [parts]
  );

  // Prepare the shaders in daylight, at an idle moment (hidden objects are not prepared), as NightFixtures does.
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
    const handle = window.setTimeout(warm, 3000);
    return () => window.clearTimeout(handle);
  }, [gl, scene, camera, frozen, parts]);

  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const state = useMemo(() => ({ wasOn: false, last: -1 }), []);
  const pivot = useMemo(() => new Object3D(), []);
  const part = useMemo(() => new Object3D(), []);
  const still = frozen || reduced;

  useFrame((frame) => {
    const host = group.current;
    if (!host) return;
    const { fixtures } = nightChannels(nightState.value);
    if (fixtures <= 0.0005) {
      if (state.wasOn) {
        host.visible = false;
        state.wasOn = false;
      }
      return;
    }
    host.visible = true;
    state.wasOn = true;
    if (state.last === fixtures && still) return;
    state.last = fixtures;
    const time = still ? 0 : frame.clock.elapsedTime;

    const shellColours = parts.shell.instanceColor!.array as Float32Array;
    const coreColours = parts.core.instanceColor!.array as Float32Array;
    const chainColours = parts.chains.instanceColor!.array as Float32Array;

    parts.lanterns.forEach((lantern, i) => {
      const lit = litness(fixtures, lantern.delay);
      const flame = lit * breath(time, i * 1.7 + 3);

      // Sway: a few milliradians about the point the chain hangs from, no two alike.
      const top = lantern.position[1] + lantern.scale * HEIGHT + lantern.chain;
      pivot.position.set(lantern.position[0], top, lantern.position[2]);
      pivot.rotation.set(Math.sin(time * 0.45 + i * 1.3) * 0.012, 0, Math.sin(time * 0.37 + i * 2.1) * 0.012);
      pivot.updateMatrixWorld(true);

      part.parent = pivot;
      part.position.set(0, -(lantern.scale * HEIGHT + lantern.chain), 0);
      part.rotation.set(0, 0, 0);
      part.scale.set(lantern.scale, lantern.scale, lantern.scale);
      part.updateMatrixWorld(true);
      parts.shell.setMatrixAt(i, part.matrixWorld);
      part.scale.set(lantern.scale * 0.78, lantern.scale * 0.9, lantern.scale * 0.78);
      part.position.set(0, -(lantern.scale * HEIGHT + lantern.chain) + lantern.scale * 0.06, 0);
      part.updateMatrixWorld(true);
      parts.core.setMatrixAt(i, part.matrixWorld);
      part.position.set(0, 0, 0);
      part.scale.set(1, Math.max(lantern.chain, 0.001), 1);
      part.updateMatrixWorld(true);
      parts.chains.setMatrixAt(i, part.matrixWorld);

      scratch.copy(BRASS_OFF).lerp(BRASS_ON, lit);
      shellColours.set([scratch.r, scratch.g, scratch.b], i * 3);
      scratch.setRGB(CORE_ON.r * flame, CORE_ON.g * flame, CORE_ON.b * flame);
      coreColours.set([scratch.r, scratch.g, scratch.b], i * 3);
      scratch.copy(CHAIN_OFF).lerp(CHAIN_ON, lit);
      chainColours.set([scratch.r, scratch.g, scratch.b], i * 3);
    });
    part.parent = null;
    parts.shell.instanceMatrix.needsUpdate = true;
    parts.core.instanceMatrix.needsUpdate = true;
    parts.chains.instanceMatrix.needsUpdate = true;
    parts.shell.instanceColor!.needsUpdate = true;
    parts.core.instanceColor!.needsUpdate = true;
    parts.chains.instanceColor!.needsUpdate = true;

    const patternColours = parts.patterns.instanceColor!.array as Float32Array;
    parts.floor.forEach(({ lantern, i }, k) => {
      const v = litness(fixtures, lantern.delay) * 0.5 * breath(time, i * 1.7 + 3);
      patternColours[k * 3] = patternColours[k * 3 + 1] = patternColours[k * 3 + 2] = v;
    });
    parts.patterns.instanceColor!.needsUpdate = true;

    for (const halo of parts.halos) {
      const array = halo.colourAttribute.array as Float32Array;
      halo.these.forEach(({ lantern, i }, k) => {
        const v = litness(fixtures, lantern.delay) * 0.95 * breath(time, i * 1.7 + 3);
        array[k * 3] = array[k * 3 + 1] = array[k * 3 + 2] = v;
      });
      halo.colourAttribute.needsUpdate = true;
    }
  });

  return <group ref={group} visible={false} />;
}
