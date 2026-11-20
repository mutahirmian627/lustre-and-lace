"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Fog, type AmbientLight, type DirectionalLight } from "three";
import { DAY } from "@/features/immersive/lib/night-look";
import { NightDirector } from "@/features/immersive/scene/NightDirector";
import { NightFixtures } from "@/features/immersive/scene/NightFixtures";
import { NightLanterns } from "@/features/immersive/scene/NightLanterns";
import { createChromeCube, createRoomCube } from "@/features/immersive/lib/reflection-cubes";
import { createMaterials, followNightMaterials } from "@/features/immersive/lib/materials";
import { createGlowTexture, createJaliMask, createTileTexture } from "@/features/immersive/lib/textures";
import { stageState } from "@/features/immersive/lib/stage-state";
import { Architecture } from "@/features/immersive/scene/Architecture";
import { EndCurtain } from "@/features/immersive/scene/EndCurtain";
import { Gallery } from "@/features/immersive/scene/Gallery";
import { IvoryHall } from "@/features/immersive/scene/IvoryHall";
import { ArchVeils } from "@/features/immersive/scene/ArchVeils";
import { CameraRig } from "@/features/immersive/scene/CameraRig";
import { HallLights } from "@/features/immersive/scene/HallLights";
import { Dust } from "@/features/immersive/scene/Dust";
import { JaliScreen } from "@/features/immersive/scene/JaliScreen";
import { Ribbon } from "@/features/immersive/scene/Ribbon";
import { ribbonSegments } from "@/features/immersive/lib/world";
import { Placards } from "@/features/immersive/scene/Placards";

interface ExperienceProps {
  lite: boolean;
  /** Rendering a still for the fallback pictures: no motion, no pointer, no easing. */
  frozen: boolean;
  /** Called once the shaders are ready to draw (before the first frame). */
  onCompiled: () => void;
  /** Called once the first frames have actually been drawn. */
  onReady: () => void;
}

/** Counts frames per second once a second, for the `?debug` readout. */
function FpsProbe() {
  const frames = useRef(0);
  const last = useRef(0);
  useFrame((state) => {
    frames.current += 1;
    const now = state.clock.elapsedTime;
    if (now - last.current >= 1) {
      stageState.fps = Math.round(frames.current / (now - last.current));
      document.documentElement.dataset.fps = String(stageState.fps);
      frames.current = 0;
      last.current = now;
    }
  });
  return null;
}

/** Tells the page the scene is on screen, two frames after drawing begins. */
function FirstFrames({ onReady }: { onReady: () => void }) {
  const count = useRef(0);
  useFrame(() => {
    count.current += 1;
    if (count.current === 3) onReady();
  });
  return null;
}

/**
 * The whole installation: lights, the building, the ribbon, the screen, the dust, the camera.
 *
 * Shaders are compiled with the browser's parallel-compile support before the first frame is drawn, so the
 * main thread isn't blocked while the page is trying to respond to the first scroll.
 */
export function Experience({ lite, frozen, onCompiled, onReady }: ExperienceProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  const resources = useMemo(() => {
    const env = createRoomCube();
    const chromeEnv = createChromeCube();
    const tileMap = createTileTexture();
    const jaliMask = createJaliMask();
    const glow = createGlowTexture();
    const materials = createMaterials(env, chromeEnv, jaliMask, lite);
    return { env, chromeEnv, tileMap, jaliMask, glow, materials };
  }, [lite]);

  useEffect(() => followNightMaterials(resources.materials), [resources]);

  const ambient = useRef<AmbientLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) onCompiled();
    };
    // Wait a tick so every object is in the scene, then compile in the background.
    const timer = window.setTimeout(() => {
      gl.compileAsync(scene, camera).then(done, done);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [gl, scene, camera, onCompiled]);

  const background = useMemo(() => new Color(DAY.ivory), []);
  const fog = useMemo(() => new Fog(DAY.ivory, DAY.fog.near, DAY.fog.far), []);

  return (
    <>
      <primitive object={background} attach="background" />
      <primitive object={fog} attach="fog" />

      {/* The gallery: warm daylight from the upper left, a cool bounce from the right (after dark: the moon). */}
      <ambientLight ref={ambient} intensity={DAY.ambient.intensity} color={DAY.ambient.color} />
      <directionalLight ref={sun} position={[...DAY.sun.position]} intensity={DAY.sun.intensity} color={DAY.sun.color} />
      <directionalLight ref={fill} position={[...DAY.fill.position]} intensity={DAY.fill.intensity} color={DAY.fill.color} />
      {!frozen && <NightDirector ambient={ambient} sun={sun} fill={fill} background={background} fog={fog} env={resources.env} chromeEnv={resources.chromeEnv} />}
      {/* The hall: soft lights high up its length, travelling with the camera once it is inside. */}
      <HallLights lite={lite} />

      {!frozen && <NightFixtures glow={resources.glow} lite={lite} frozen={frozen} />}
      {!frozen && <NightLanterns jaliMask={resources.jaliMask} glow={resources.glow} frozen={frozen} />}

      <Architecture materials={resources.materials} tileMap={resources.tileMap} glow={resources.glow} lite={lite} />
      <EndCurtain glow={resources.glow} lite={lite} />
      <IvoryHall materials={resources.materials} tileMap={resources.tileMap} jaliMask={resources.jaliMask} glow={resources.glow} lite={lite} />
      <Gallery materials={resources.materials} jaliMask={resources.jaliMask} glow={resources.glow} lite={lite} frozen={frozen} />
      <JaliScreen materials={resources.materials} jaliMask={resources.jaliMask} lite={lite} />
      <ArchVeils materials={resources.materials} jaliMask={resources.jaliMask} glow={resources.glow} lite={lite} />
      <Ribbon materials={resources.materials} segments={ribbonSegments(lite)} halfRate={lite} frozen={frozen} />
      {!lite && <Dust glow={resources.glow} frozen={frozen} />}

      <CameraRig frozen={frozen} />
      {!frozen && <Placards />}
      <FpsProbe />
      <FirstFrames onReady={onReady} />
    </>
  );
}
