"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useDeviceTier, useQueryFlag } from "@/features/immersive/hooks/useDeviceTier";
import { useMenuOpen } from "@/features/immersive/lib/menu-store";
import { trackPointer } from "@/features/immersive/lib/pointer";
import { stageState } from "@/features/immersive/lib/stage-state";
import { registerRetry, setStageMode } from "@/features/immersive/lib/stage-mode";
import { downgradeTier, type StillReason, type Tier } from "@/features/immersive/lib/tiers";
import { whenNeeded } from "@/features/immersive/lib/when-needed";
import { StageBoundary } from "@/features/immersive/scene/StageBoundary";

// The whole 3D library lives in this one chunk. It is requested only after the page has painted and the
// browser is idle, and not at all on devices that cannot run it.
const Stage = dynamic(() => import("@/features/immersive/scene/Stage"), { ssr: false });

/** If the scene hasn't compiled and drawn within this long, something is wrong: show pictures rather than wait forever. */
const GIVE_UP_AFTER_MS = 30_000;

/**
 * Decides whether this visitor gets the live scene, and mounts it.
 *
 * The page always begins as a pre-rendered picture of the scene (see Backdrop), so it looks finished before any 3D
 * code has loaded. When the live scene has compiled and drawn its first frames, the picture fades out and the canvas
 * takes over in the same framing.
 *
 * The live scene is the experience, so the rules for giving it up are narrow (see lib/tiers.ts):
 *  - at load, only for no WebGL 2, or an explicit request for reduced motion or data saving;
 *  - afterwards, only by steps and only for a real reason: a frame-rate watchdog moves full to lite, and lite to
 *    pictures only if even that is struggling; a crash or a lost graphics context also falls back to pictures.
 * None of these is permanent. The fallback is itself in motion (StillJourney), says why it is there, and offers a
 * button to try the live scene again (StillNote).
 *
 * `data-stage` on the page root says which layer is showing ("loading", "live" or "static") and
 * `data-stage-reason` says why, if it is pictures. Two URL switches exist for testing: `?poster=1&p=0.5` renders a
 * motionless, chrome-free frame at scroll position `p` (0 to 2), used to make the fallback pictures, and `?debug` shows
 * a readout of the device and what the page decided.
 */
export function StageLoader() {
  const detected = useDeviceTier();
  const poster = useQueryFlag("poster");
  const menuOpen = useMenuOpen();
  const [downgraded, setDowngraded] = useState<Tier | null>(null);
  const [fellBack, setFellBack] = useState<StillReason | null>(null);
  const [optedIn, setOptedIn] = useState(false);
  const [idle, setIdle] = useState(false);
  const [compiled, setCompiled] = useState(false);
  const [ready, setReady] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [attempt, setAttempt] = useState(0);

  // The visitor may ask for the live scene back, whatever the reason it was off, except where it can't run at all.
  const canRetry = detected !== null && detected.stillReason !== "no-webgl2";

  let tier: Tier | null = null;
  if (poster) tier = "full";
  else if (downgraded !== null) tier = downgraded;
  else if (detected) tier = detected.tier === "static" && optedIn && canRetry ? "lite" : detected.tier;

  const wantsCanvas = tier !== null && tier !== "static";
  const showCanvas = wantsCanvas && idle;
  const stillReason: StillReason | null =
    tier === "static" ? (downgraded === "static" ? (fellBack ?? "error") : (detected?.stillReason ?? null)) : null;

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

  // Poster mode: strip the page down and pose the scene at the requested scroll position (0 to 2).
  useEffect(() => {
    if (!poster) return;
    const root = document.documentElement;
    root.dataset.immersivePoster = "1";
    const p = Number(new URLSearchParams(window.location.search).get("p") ?? "0");
    stageState.target = Number.isFinite(p) ? Math.min(2, Math.max(0, p)) : 0;
    return () => {
      delete root.dataset.immersivePoster;
      delete root.dataset.stageReady;
    };
  }, [poster]);
  useEffect(() => {
    if (poster && ready) document.documentElement.dataset.stageReady = "1";
  }, [poster, ready]);

  // Tell the page which layer is showing, and why.
  const live = showCanvas && ready;
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".immersive-root");
    if (!root) return;
    root.dataset.stage = live ? "live" : tier === "static" ? "static" : "loading";
    if (stillReason) root.dataset.stageReason = stillReason;
    else delete root.dataset.stageReason;
    return () => {
      delete root.dataset.stage;
      delete root.dataset.stageReason;
    };
  }, [live, tier, stillReason]);
  useEffect(() => {
    if (poster) return;
    setStageMode(live ? "live" : tier === "static" ? "still" : "loading", stillReason);
  }, [poster, live, tier, stillReason]);

  const fallBack = useCallback((reason: StillReason) => {
    setReady(false);
    setCompiled(false);
    setFellBack(reason);
    setDowngraded("static");
  }, []);

  const onCompiled = useCallback(() => setCompiled(true), []);
  const onReady = useCallback(() => setReady(true), []);
  // The watchdog: full -> lite, and lite -> pictures only if even that is struggling.
  const onDecline = useCallback(() => {
    const next = downgradeTier(tier ?? "full");
    if (next === "static") return fallBack("slow-frames");
    setReady(false);
    setCompiled(false);
    setDowngraded(next);
  }, [tier, fallBack]);
  const onCrash = useCallback(() => fallBack("error"), [fallBack]);

  // The visitor's (or the page's own) request to try the live scene again, on the lighter tier to be safe.
  const retry = useCallback(() => {
    setFellBack(null);
    setOptedIn(true);
    setReady(false);
    setCompiled(false);
    setDowngraded("lite");
    setAttempt((n) => n + 1);
  }, []);
  useEffect(() => {
    if (poster) return;
    registerRetry(canRetry ? retry : null);
    return () => registerRetry(null);
  }, [poster, canRetry, retry]);

  // Never wait forever for a scene that isn't coming.
  useEffect(() => {
    if (!showCanvas || ready || poster) return;
    const timer = window.setTimeout(() => fallBack("error"), GIVE_UP_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [showCanvas, ready, poster, fallBack, attempt]);

  if (!showCanvas || tier === null || tier === "static") return null;

  return createPortal(
    <StageBoundary key={`${tier}-${attempt}`} onError={onCrash}>
      <Stage
        tier={tier}
        active={compiled && tabVisible && !menuOpen}
        frozen={poster}
        onCompiled={onCompiled}
        onReady={onReady}
        onDecline={onDecline}
        onLost={onCrash}
      />
    </StageBoundary>,
    document.body
  );
}
