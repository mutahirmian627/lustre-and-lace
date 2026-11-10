"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Fog } from "three";
import { createChromeCube, createRoomCube } from "@/features/immersive/lib/reflection-cubes";
import { createMaterials } from "@/features/immersive/lib/materials";
import { createGlowTexture, createJaliMask, createTileTexture } from "@/features/immersive/lib/textures";
import { PORTAL, WALL } from "@/features/immersive/lib/world";
import { stageState } from "@/features/immersive/lib/stage-state";
import { Architecture } from "@/features/immersive/scene/Architecture";
import { CameraRig } from "@/features/immersive/scene/CameraRig";
import { Dust } from "@/features/immersive/scene/Dust";
import { JaliScreen } from "@/features/immersive/scene/JaliScreen";
import { Ribbon } from "@/features/immersive/scene/Ribbon";
import { Placards } from "@/features/immersive/scene/Placards";

const IVORY = "#f1ebdf";

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
    return { tileMap, jaliMask, glow, materials };
  }, [lite]);

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

  const background = useMemo(() => new Color(IVORY), []);
  const fog = useMemo(() => new Fog(IVORY, 18, 52), []);

  return (
    <>
      <primitive object={background} attach="background" />
      <primitive object={fog} attach="fog" />

      {/* The gallery: warm daylight from the upper left, a cool bounce from the right. */}
      <ambientLight intensity={1.9} color="#fffdfa" />
      <directionalLight position={[-4, 7, 6]} intensity={2.2} color="#fff9f0" />
      <directionalLight position={[7, 3, 2]} intensity={0.65} color="#cfc2e8" />
      {/* The hall: two rose lights high up its length, so the lacquer glows from within. */}
      <pointLight position={[PORTAL.x, 5, WALL.z - 8]} intensity={9} distance={8.5} decay={1.4} color="#ff9db8" />
      <pointLight position={[PORTAL.x, 5, WALL.z - 15]} intensity={9} distance={8.5} decay={1.4} color="#ff9db8" />
      <pointLight position={[PORTAL.x, 5, WALL.z - 22]} intensity={9} distance={8.5} decay={1.4} color="#ff9db8" />

      <Architecture materials={resources.materials} tileMap={resources.tileMap} glow={resources.glow} lite={lite} />
      <JaliScreen materials={resources.materials} jaliMask={resources.jaliMask} lite={lite} />
      <Ribbon materials={resources.materials} segments={lite ? 130 : 220} halfRate={lite} frozen={frozen} />
      {!lite && <Dust glow={resources.glow} frozen={frozen} />}

      <CameraRig frozen={frozen} />
      {!frozen && <Placards />}
      <FpsProbe />
      <FirstFrames onReady={onReady} />
    </>
  );
}
