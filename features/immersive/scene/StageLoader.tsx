"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useDeviceTier, useQueryFlag } from "@/features/immersive/hooks/useDeviceTier";
import { useMenuOpen } from "@/features/immersive/lib/menu-store";
import { trackPointer } from "@/features/immersive/lib/pointer";
import { stageState } from "@/features/immersive/lib/stage-state";
import { downgradeTier, type Tier } from "@/features/immersive/lib/tiers";
import { whenNeeded } from "@/features/immersive/lib/when-needed";

// The whole 3D library lives in this one chunk. It is requested only after the page has painted and the
// browser is idle, and never on devices that were sorted into the "static" tier.
const Stage = dynamic(() => import("@/features/immersive/scene/Stage"), { ssr: false });

/**
 * Decides whether this visitor gets the live scene, and mounts it.
 *
 * The page always begins as a pre-rendered picture of the scene (see Backdrop), so it looks finished
 * before any 3D code has loaded and stays that way on devices that never load it. When the live scene
 * has compiled and drawn its first frames, the picture fades out and the canvas takes over in the same
 * framing. `data-stage` on the page root says which is showing: "static", "loading" or "live".
 *
 * Two URL switches exist for testing: `?poster=1&p=0` renders a motionless, chrome-free frame at scroll
 * position `p` (used to make the fallback pictures), and `?debug` shows a readout of the device tier.
 */
export function StageLoader() {
  const detected = useDeviceTier();
  const poster = useQueryFlag("poster");
  const menuOpen = useMenuOpen();
  const [downgraded, setDowngraded] = useState<Tier | null>(null);
  const [idle, setIdle] = useState(false);
  const [compiled, setCompiled] = useState(false);
  const [ready, setReady] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const tier: Tier | null = poster ? "full" : (downgraded ?? detected?.tier ?? null);
  const wantsCanvas = tier !== null && tier !== "static";
  const showCanvas = wantsCanvas && idle;

  useEffect(() => {
    if (!wantsCanvas) return;
    if (poster) {
      const t = window.setTimeout(() => setIdle(true), 0);
      return () => window.clearTimeout(t);
    }
    return whenNeeded(() => setIdle(true), { idleTimeout: 1500 });
  }, [wantsCanvas, poster]);

  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  useEffect(() => {
    if (!showCanvas || poster) return;
    return trackPointer();
  }, [showCanvas, poster]);

  // Poster mode: strip the page down and pose the scene at the requested scroll position.
  useEffect(() => {
    if (!poster) return;
    const root = document.documentElement;
    root.dataset.immersivePoster = "1";
    const p = Number(new URLSearchParams(window.location.search).get("p") ?? "0");
    stageState.target = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
    return () => {
      delete root.dataset.immersivePoster;
      delete root.dataset.stageReady;
    };
  }, [poster]);
  useEffect(() => {
    if (poster && ready) document.documentElement.dataset.stageReady = "1";
  }, [poster, ready]);

  // Tell the page which layer is showing.
  const live = showCanvas && ready;
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".immersive-root");
    if (!root) return;
    root.dataset.stage = live ? "live" : tier === "static" ? "static" : "loading";
    return () => {
      delete root.dataset.stage;
    };
  }, [live, tier]);

  const onCompiled = useCallback(() => setCompiled(true), []);
  const onReady = useCallback(() => setReady(true), []);
  const onDecline = useCallback(() => {
    setReady(false);
    setCompiled(false);
    setDowngraded(downgradeTier(tier ?? "full"));
  }, [tier]);

  if (!showCanvas || tier === null) return null;

  return createPortal(
    <Stage
      key={tier}
      tier={tier}
      active={compiled && tabVisible && !menuOpen}
      frozen={poster}
      onCompiled={onCompiled}
      onReady={onReady}
      onDecline={onDecline}
    />,
    document.body
  );
}
