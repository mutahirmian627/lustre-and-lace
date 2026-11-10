"use client";

import { useEffect, useRef } from "react";
import { pointer, trackPointer } from "@/features/immersive/lib/pointer";
import { stageState } from "@/features/immersive/lib/stage-state";

/** How many pre-rendered frames the journey is made of (see scripts/render-immersive-journey.mjs). */
export const JOURNEY_FRAMES = 60;
/** Scenes 0..2 run from the gallery's opening to the end of the corridor. */
const SCENES = 2;

const framePath = (tall: boolean, index: number) => `/immersive/journey/${tall ? "p" : "l"}-${String(index).padStart(2, "0")}.webp`;

/**
 * The fallback for devices that are not running the live scene: the same journey as a sequence of frames rendered from
 * the real scene, played by scroll (neighbouring frames cross-faded, so it reads as continuous travel) and never still:
 * the picture drifts and breathes slowly on its own, and follows the pointer, as the live scene does. So even here the
 * visitor travels through the doorway and down the hall; only the ribbon's own movement is missing.
 *
 * For reduced motion the drift and pointer response are switched off; scrolling still moves through the frames, since
 * that is the visitor's own movement.
 */
export function StillJourney() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;

    const tall = window.matchMedia("(max-aspect-ratio: 17/20)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frames: (HTMLImageElement | null)[] = new Array(JOURNEY_FRAMES).fill(null);

    // Fetch frame 0 first (it is what is on screen already), then the rest in order of how soon they will be needed.
    for (let i = 0; i < JOURNEY_FRAMES; i++) {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        frames[i] = image;
      };
      image.src = framePath(tall, i);
    }

    const stopPointer = calm ? () => {} : trackPointer();
    let width = 0;
    let height = 0;
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.round(element.clientWidth * scale);
      height = Math.round(element.clientHeight * scale);
      element.width = width;
      element.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    /** The nearest frame that has arrived, searching outwards from `index`. */
    const nearest = (index: number) => {
      for (let step = 0; step < JOURNEY_FRAMES; step++) {
        const lower = frames[index - step];
        if (lower) return lower;
        const upper = frames[index + step];
        if (upper) return upper;
      }
      return null;
    };

    let position = 0;
    let px = 0;
    let py = 0;
    let last = performance.now();
    let handle = 0;
    const draw = (now: number) => {
      handle = requestAnimationFrame(draw);
      if (document.visibilityState !== "visible") return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      // Ease towards where the scroll is, so a quick flick glides.
      position += (stageState.target - position) * (1 - Math.exp(-6 * dt));
      const exact = (Math.min(SCENES, Math.max(0, position)) / SCENES) * (JOURNEY_FRAMES - 1);
      const lowerIndex = Math.min(JOURNEY_FRAMES - 1, Math.floor(exact));
      const blend = exact - lowerIndex;

      px += ((calm ? 0 : pointer.x) - px) * (1 - Math.exp(-3 * dt));
      py += ((calm ? 0 : pointer.y) - py) * (1 - Math.exp(-3 * dt));
      const seconds = now / 1000;
      const breathe = calm ? 0 : Math.sin(seconds * 0.35);
      const zoom = 1.035 + 0.012 * breathe;
      const driftX = calm ? 0 : Math.sin(seconds * 0.21) * 0.006 + px * 0.012;
      const driftY = calm ? 0 : Math.cos(seconds * 0.17) * 0.004 + py * 0.008;

      const first = nearest(lowerIndex);
      if (!first) return;
      context.save();
      context.clearRect(0, 0, width, height);
      context.translate(width / 2 + driftX * width, height / 2 - driftY * height);
      context.scale(zoom, zoom);
      context.translate(-width / 2, -height / 2);
      const cover = (image: HTMLImageElement) => {
        const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const w = image.naturalWidth * scale;
        const h = image.naturalHeight * scale;
        context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
      };
      cover(first);
      const second = blend > 0.001 ? nearest(Math.min(JOURNEY_FRAMES - 1, lowerIndex + 1)) : null;
      if (second && second !== first) {
        context.globalAlpha = blend;
        cover(second);
      }
      context.restore();
    };
    handle = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener("resize", resize);
      stopPointer();
    };
  }, []);

  return <canvas ref={canvas} className="imm-journey" aria-hidden="true" />;
}
