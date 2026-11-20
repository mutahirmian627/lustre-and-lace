"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type AmbientLight, type CubeTexture, type DirectionalLight, type Fog } from "three";
import { createCubeFade } from "@/features/immersive/lib/reflection-cubes";
import { DAY, NIGHT } from "@/features/immersive/lib/night-look";
import { applyNight, initialNight, mix, nightChannels, nightState, setNight, stepNight } from "@/features/immersive/lib/night";

interface NightDirectorProps {
  ambient: RefObject<AmbientLight | null>;
  sun: RefObject<DirectionalLight | null>;
  fill: RefObject<DirectionalLight | null>;
  background: Color;
  fog: Fog;
  env: CubeTexture;
  chromeEnv: CubeTexture;
}

const DAY_IVORY = new Color(DAY.ivory);
const NIGHT_ROOM = new Color(NIGHT.room);
const DAY_AMBIENT = new Color(DAY.ambient.color);
const NIGHT_AMBIENT = new Color(NIGHT.ambient.color);
const DAY_FILL = new Color(DAY.fill.color);
const NIGHT_MOON = new Color(NIGHT.moon.color);

/**
 * Conducts the change between daylight and after dark for the whole scene.
 *
 * It owns the shared lights, the background and the fog, and the two painted reflection worlds, and it calls everything
 * else that follows the change (the unlit glow, the hall's lamps, the fixtures) through the registry in lib/night.ts.
 * Every day value is a constant in night-look.ts: at the start of the change each channel is 0 or 1 exactly, so the
 * daytime scene is rebuilt from the same constants it was made from, with no remembered "previous" values to drift.
 *
 * While nothing is changing it does nothing at all, so after dark costs no more per frame than daylight does.
 */
export function NightDirector({ ambient, sun, fill, background, fog, env, chromeEnv }: NightDirectorProps) {
  const fades = useMemo(() => [createCubeFade(env, "room"), createCubeFade(chromeEnv, "chrome")], [env, chromeEnv]);

  // The state the page was left in (the address, then the visitor's last choice), with no transition on loading.
  useEffect(() => {
    setNight(initialNight(window.location.search), { instant: true, save: false });
    const root = document.querySelector<HTMLElement>(".immersive-root");
    return () => {
      root?.style.removeProperty("--dark");
      nightState.target = 0;
      nightState.value = 0;
    };
  }, []);

  // Paint the night reflections in idle moments (one face at a time), so the first change doesn't pay for them.
  useEffect(() => {
    let cancelled = false;
    let handle: number | undefined;
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = (callback: () => void) => (hasIdle ? window.requestIdleCallback(callback, { timeout: 2500 }) : window.setTimeout(callback, 200));
    const paint = () => {
      if (cancelled) return;
      const remaining = fades.map((fade) => (fade.ready ? true : fade.prepare())).includes(false);
      if (remaining) handle = idle(paint);
    };
    handle = idle(paint);
    return () => {
      cancelled = true;
      if (handle === undefined) return;
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [fades]);

  const state = useMemo(() => ({ applied: -1 }), []);

  useFrame((_, delta) => {
    // A long frame (a tab coming back) must not skip the change: cap what one frame can advance.
    const moved = stepNight(Math.min(delta, 0.1));
    if (!moved && state.applied === nightState.value) return;
    state.applied = nightState.value;

    const c = nightChannels(nightState.value);
    const night = 1 - c.daylight;

    const light = ambient.current;
    if (light) {
      light.intensity = mix(DAY.ambient.intensity, NIGHT.ambient.intensity, night);
      light.color.copy(DAY_AMBIENT).lerp(NIGHT_AMBIENT, night);
    }
    const sunLight = sun.current;
    if (sunLight) sunLight.intensity = DAY.sun.intensity * c.daylight;

    const moonLight = fill.current;
    if (moonLight) {
      moonLight.intensity = DAY.fill.intensity * c.daylight + NIGHT.moon.intensity * c.moon;
      moonLight.color.copy(DAY_FILL).lerp(NIGHT_MOON, c.moon);
      moonLight.position.set(
        mix(DAY.fill.position[0], NIGHT.moon.position[0], c.moon),
        mix(DAY.fill.position[1], NIGHT.moon.position[1], c.moon),
        mix(DAY.fill.position[2], NIGHT.moon.position[2], c.moon)
      );
    }

    background.copy(DAY_IVORY).lerp(NIGHT_ROOM, c.dark);
    fog.color.copy(background);
    fog.near = mix(DAY.fog.near, NIGHT.fog.near, c.dark);
    fog.far = mix(DAY.fog.far, NIGHT.fog.far, c.dark);

    for (const fade of fades) fade.set(c.reflections);

    // The page's own colours (text, bar, scrims) follow the same darkening.
    document.querySelector<HTMLElement>(".immersive-root")?.style.setProperty("--dark", c.ui.toFixed(4));

    applyNight(c);
  });

  return null;
}
