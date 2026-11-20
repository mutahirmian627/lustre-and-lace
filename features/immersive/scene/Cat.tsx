"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PlaneGeometry,
  SphereGeometry,
  BackSide,
  type BufferGeometry,
} from "three";
import { CatBrain } from "@/features/immersive/lib/cat";
import { stageState } from "@/features/immersive/lib/stage-state";
import type { Materials } from "@/features/immersive/lib/materials";
import { useOnNight } from "@/features/immersive/lib/use-on-night";

/**
 * A small white cat, in the installation's own material: glazed ivory ceramic, round and chubby like a toy, with a soft brown
 * outline, pink inner ears and cheeks, and a little open mouth. It sits on the floor a few metres ahead of the camera, facing the
 * viewer; when the page is scrolled it stands, turns its back and walks on down the way; when the scroll stops it turns round
 * and sits again (see lib/cat.ts for the behaviour). It is built from a dozen primitives, each with an outline shell, and animated
 * by setting rotations: no model file, no animation library, a few thousand triangles in all.
 *
 * Its model faces +z with its feet on y = 0.
 */

const COAT = "#fffaf3";
const OUTLINE_DAY = new Color("#7a4a43");
const OUTLINE_NIGHT = new Color("#4d2d2c");
const EMISSIVE_NIGHT = new Color("#b49878");
const BLACK = new Color(0x000000);

/** A unit sphere stretched to an ellipsoid (the stretch is baked in, so the outline can be pushed out along true normals). */
function ellipsoid(rx: number, ry: number, rz: number, segments: number) {
  const geometry = new SphereGeometry(1, segments, Math.max(8, Math.round(segments * 0.75)));
  geometry.scale(rx, ry, rz);
  return geometry;
}

/** The same shape, pushed outwards by `thickness` along its normals, for drawing inside-out behind it as an outline. */
function shell(geometry: BufferGeometry, thickness: number) {
  const copy = geometry.clone();
  const position = copy.getAttribute("position");
  const normal = copy.getAttribute("normal");
  for (let i = 0; i < position.count; i++) position.setXYZ(i, position.getX(i) + normal.getX(i) * thickness, position.getY(i) + normal.getY(i) * thickness, position.getZ(i) + normal.getZ(i) * thickness);
  return copy;
}

/** A soft dark blob for the floor under the cat. */
function blobTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 30);
  gradient.addColorStop(0, "rgba(20,8,24,0.9)");
  gradient.addColorStop(0.55, "rgba(20,8,24,0.4)");
  gradient.addColorStop(1, "rgba(20,8,24,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new CanvasTexture(canvas);
  return texture;
}

interface LegRig {
  group: Group;
  /** Which diagonal pair it walks with (0 or π), and whether it is a front leg. */
  offset: number;
  front: boolean;
}

export function Cat({ materials, lite }: { materials: Materials; lite: boolean }) {
  const root = useRef<Group>(null);
  const bodyPivot = useRef<Group>(null);
  const head = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const tail = useRef<(Group | null)[]>([]);
  const legs = useRef<(LegRig | null)[]>([]);
  const blob = useRef<Mesh>(null);
  const brain = useMemo(() => new CatBrain(), []);

  const parts = useMemo(() => {
    const s = lite ? 16 : 28;
    const coat = materials.ceramic.clone();
    coat.color.set(COAT);
    coat.specular.set(0x55504a);
    coat.shininess = 38;
    const outline = new MeshBasicMaterial({ color: OUTLINE_DAY, side: BackSide, fog: false, toneMapped: false });
    const pink = new MeshPhongMaterial({ color: "#f4a3b0", shininess: 8, specular: 0x222222 });
    const cheek = new MeshBasicMaterial({ color: "#f7a8b2", transparent: true, opacity: 0.62, depthWrite: false, fog: false, toneMapped: false });
    const dark = new MeshBasicMaterial({ color: "#3a2420", fog: false, toneMapped: false });
    const mouth = new MeshBasicMaterial({ color: "#df5568", fog: false, toneMapped: false });
    const shine = new MeshBasicMaterial({ color: "#ffffff", fog: false, toneMapped: false });
    const blobMaterial = new MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.4, fog: false, toneMapped: false });

    const geometries = {
      body: ellipsoid(0.21, 0.19, 0.27, s),
      head: ellipsoid(0.3, 0.25, 0.26, s),
      leg: new CapsuleGeometry(0.058, 0.12, 4, 10),
      ear: new ConeGeometry(0.095, 0.16, 5),
      earInner: new ConeGeometry(0.06, 0.1, 5),
      tail: new CapsuleGeometry(0.045, 0.1, 4, 8),
      eye: ellipsoid(0.03, 0.04, 0.018, 10),
      glint: ellipsoid(0.01, 0.01, 0.006, 6),
      cheek: ellipsoid(0.055, 0.04, 0.012, 10),
      mouth: ellipsoid(0.028, 0.034, 0.012, 10),
      blob: new PlaneGeometry(1, 1),
    };
    // The leg hangs from its top; the ears and tail point up from their base.
    geometries.leg.translate(0, -0.12, 0);
    geometries.tail.translate(0, 0.07, 0);
    geometries.ear.translate(0, 0.07, 0);
    geometries.earInner.translate(0, 0.045, 0);
    const shells = {
      body: shell(geometries.body, 0.012),
      head: shell(geometries.head, 0.012),
      leg: shell(geometries.leg, 0.011),
      ear: shell(geometries.ear, 0.011),
      tail: shell(geometries.tail, 0.011),
    };
    return { coat, outline, pink, cheek, dark, mouth, shine, blobMaterial, geometries, shells };
  }, [materials, lite]);

  // After dark the outline goes deeper and the glaze takes a little warmth, so the cat is not a grey lump in the dim.
  useOnNight(
    (c) => {
      parts.outline.color.copy(OUTLINE_DAY).lerp(OUTLINE_NIGHT, c.dark);
      parts.coat.emissive.copy(BLACK).lerp(EMISSIVE_NIGHT, c.dark);
      parts.blobMaterial.opacity = 0.4 + 0.2 * c.dark;
    },
    [parts]
  );

  useEffect(
    () => () => {
      for (const group of [parts.geometries, parts.shells]) Object.values(group).forEach((geometry) => geometry.dispose());
      parts.coat.dispose();
      parts.outline.dispose();
      parts.pink.dispose();
      parts.cheek.dispose();
      parts.dark.dispose();
      parts.mouth.dispose();
      parts.shine.dispose();
      parts.blobMaterial.map?.dispose();
      parts.blobMaterial.dispose();
    },
    [parts]
  );

  const state = useMemo(() => ({ blinkAt: 2.5, blinking: 0 }), []);

  useFrame((frame, delta) => {
    const group = root.current;
    const body = bodyPivot.current;
    if (!group || !body) return;
    const dt = Math.min(delta, 0.1);
    const t = frame.clock.elapsedTime;

    const pose = brain.step(dt, {
      travelX: stageState.travel.x,
      travelZ: stageState.travel.z,
      lookX: stageState.look.x,
      lookZ: stageState.look.z,
      camY: stageState.camera.y,
      lookY: stageState.look.y,
      pull: stageState.pull,
    });
    const sit = pose.sit;
    const stand = 1 - sit;

    // Peeking at the start, it leans out and in, a few centimetres, as if deciding whether to come out.
    group.position.set(pose.x + Math.sin(t * 0.55) * 0.09 * pose.peek, 0, pose.z);
    group.rotation.y = pose.yaw;
    group.scale.setScalar(pose.scale);

    // Walking: diagonal pairs of legs swing in turn, the body bobs twice per stride and rolls a little over each planted foot.
    const stride = pose.phase;
    const bob = Math.abs(Math.sin(stride)) * 0.022 * stand;
    const pitch = -1.0 * sit;
    body.position.y = MathUtils.lerp(0.3, 0.2, sit) + bob;
    body.rotation.x = pitch + Math.sin(stride * 2) * 0.03 * stand;
    body.rotation.z = Math.sin(stride) * 0.06 * stand;

    for (const rig of legs.current) {
      if (!rig) continue;
      const swing = Math.sin(stride + rig.offset) * 0.62 * stand;
      if (rig.front) {
        // The front legs hang straight down whatever the body does, a little longer when sitting (the shoulders are higher then).
        rig.group.rotation.x = -pitch + swing;
        rig.group.scale.y = MathUtils.lerp(1, 1.3, sit);
      } else {
        // The hind legs swing when walking, and fold forward under the haunches when sitting.
        rig.group.rotation.x = MathUtils.lerp(swing, 1.35, sit);
        rig.group.scale.y = MathUtils.lerp(1, 0.9, sit);
      }
    }

    // The head stays level when the body sits up, with a gentle nod as it walks, and turns a touch towards the camera when sitting.
    const headNode = head.current;
    if (headNode) {
      headNode.rotation.x = -pitch * 0.92 + Math.sin(stride * 2 + 0.6) * 0.03 * stand;
      // Peeking, the head is tilted, curious, towards the opening, and rocks slowly.
      headNode.rotation.z = Math.sin(t * 0.5) * 0.03 * sit + Math.sin(stride) * 0.025 * stand + pose.peek * (0.3 + Math.sin(t * 0.8) * 0.06);
    }

    // The tail: up and curling, swaying slowly while it sits and with the stride while it walks; wrapped low round the feet when sat.
    const sway = Math.sin(t * 1.3) * 0.18 * sit + Math.sin(stride + 1.2) * 0.22 * stand;
    const [t0, t1, t2] = tail.current;
    if (t0) {
      t0.rotation.x = MathUtils.lerp(-0.55, -2.2, sit);
      t0.rotation.z = sway;
    }
    if (t1) {
      t1.rotation.x = MathUtils.lerp(0.35, 0.5, sit);
      t1.rotation.z = sway * 0.8;
    }
    if (t2) {
      t2.rotation.x = MathUtils.lerp(0.45, 0.55, sit);
      t2.rotation.z = sway * 0.6;
    }

    // A blink every few seconds while it sits, so it looks back at us.
    const eyesNode = eyes.current;
    if (eyesNode) {
      if (state.blinking > 0) state.blinking -= dt;
      else if (t > state.blinkAt && sit > 0.9) {
        state.blinking = 0.14;
        state.blinkAt = t + 2.6 + ((t * 7.3) % 3);
      }
      eyesNode.scale.y = state.blinking > 0 ? 0.12 : 1;
    }

    // The soft shadow stays under it, a little wider when it sits.
    const shadow = blob.current;
    if (shadow) {
      shadow.position.set(0, 0.012, 0);
      const size = MathUtils.lerp(0.62, 0.82, sit);
      shadow.scale.set(size, size * 1.15, 1);
    }
  });

  const { coat, outline, pink, cheek, dark, mouth, shine, blobMaterial, geometries, shells } = parts;

  const legAt = (x: number, y: number, z: number, offset: number, front: boolean, index: number) => (
    <group
      key={index}
      ref={(group) => {
        legs.current[index] = group ? { group, offset, front } : null;
      }}
      position={[x, y, z]}
    >
      <mesh geometry={geometries.leg} material={coat} />
      <mesh geometry={shells.leg} material={outline} />
    </group>
  );

  return (
    <group ref={root} dispose={null}>
      <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} geometry={geometries.blob} material={blobMaterial} renderOrder={1} />
      <group ref={bodyPivot} position={[0, 0.3, 0]}>
        <mesh geometry={geometries.body} material={coat} />
        <mesh geometry={shells.body} material={outline} />

        {/* The head: big and round, set forward on the body. */}
        <group ref={head} position={[0, 0.17, 0.22]}>
          <mesh geometry={geometries.head} material={coat} />
          <mesh geometry={shells.head} material={outline} />
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.17, 0.2, -0.02]} rotation={[0, 0, -side * 0.38]}>
              <mesh geometry={geometries.ear} material={coat} />
              <mesh geometry={shells.ear} material={outline} />
              <mesh geometry={geometries.earInner} material={pink} position={[0, 0.005, 0.034]} scale={[0.85, 0.85, 0.6]} />
            </group>
          ))}
          <group ref={eyes}>
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 0.105, 0.025, 0.244]}>
                <mesh geometry={geometries.eye} material={dark} />
                <mesh geometry={geometries.glint} material={shine} position={[0.008, 0.014, 0.012]} />
              </group>
            ))}
          </group>
          {[-1, 1].map((side) => (
            <mesh key={side} geometry={geometries.cheek} material={cheek} position={[side * 0.178, -0.06, 0.188]} rotation={[0, side * 0.55, 0]} />
          ))}
          <mesh geometry={geometries.mouth} material={mouth} position={[0, -0.062, 0.248]} />
        </group>

        {/* The tail: three short segments, curling up. */}
        <group
          ref={(group) => {
            tail.current[0] = group;
          }}
          position={[0, 0.02, -0.25]}
        >
          <mesh geometry={geometries.tail} material={coat} />
          <mesh geometry={shells.tail} material={outline} />
          <group
            ref={(group) => {
              tail.current[1] = group;
            }}
            position={[0, 0.16, 0]}
          >
            <mesh geometry={geometries.tail} material={coat} scale={0.9} />
            <mesh geometry={shells.tail} material={outline} scale={0.9} />
            <group
              ref={(group) => {
                tail.current[2] = group;
              }}
              position={[0, 0.14, 0]}
            >
              <mesh geometry={geometries.tail} material={coat} scale={0.8} />
              <mesh geometry={shells.tail} material={outline} scale={0.8} />
            </group>
          </group>
        </group>

        {/* Four legs: front pair at the shoulders, hind pair at the haunches (diagonals walk together). */}
        {legAt(-0.11, -0.04, 0.15, 0, true, 0)}
        {legAt(0.11, -0.04, 0.15, Math.PI, true, 1)}
        {legAt(-0.12, -0.05, -0.13, Math.PI, false, 2)}
        {legAt(0.12, -0.05, -0.13, 0, false, 3)}
      </group>
    </group>
  );
}
