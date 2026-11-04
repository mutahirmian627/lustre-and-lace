"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useDeviceTier, useQueryFlag } from "@/features/immersive/hooks/useDeviceTier";
import { trackPointer } from "@/features/immersive/lib/pointer";
import { downgradeTier, type Tier } from "@/features/immersive/lib/tiers";
import { GEM_ANCHOR_ID } from "@/features/immersive/constants";
import { cn } from "@/lib/utils";

// The whole 3D library lives in this one chunk. It is requested only after the page has painted and the
// browser is idle, and never on devices that were sorted into the "static" tier.
const StageCanvas = dynamic(() => import("@/features/immersive/stage/StageCanvas"), { ssr: false });

/**
 * The gem's place in the page, plus everything that decides how it is shown.
 *
 * The anchor box below is ordinary layout. It always holds a pre-rendered picture of the gem, so the
 * page looks finished before any 3D code has loaded, and stays that way on devices that never load it.
 * When the 3D scene is ready the live gem fades in over the same spot and the picture fades out.
 */
export function GemStage({ className }: { className?: string }) {
  const detected = useDeviceTier();
  const poster = useQueryFlag("poster");
  const [downgraded, setDowngraded] = useState<Tier | null>(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [idle, setIdle] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const tier: Tier | null = poster ? "full" : (downgraded ?? detected?.tier ?? null);
  const wantsCanvas = tier !== null && tier !== "static";
  const showCanvas = wantsCanvas && idle;

  // Wait until the browser has nothing better to do before fetching the 3D code.
  useEffect(() => {
    if (!wantsCanvas) return;
    const start = () => setIdle(true);
    if (poster) {
      const t = window.setTimeout(start, 0);
      return () => window.clearTimeout(t);
    }
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(handle);
    }
    const t = window.setTimeout(start, 600);
    return () => window.clearTimeout(t);
  }, [wantsCanvas, poster]);

  // Stop drawing frames while the gem is off screen or the tab is in the background.
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  useEffect(() => {
    if (!showCanvas || poster) return;
    return trackPointer();
  }, [showCanvas, poster]);

  // Poster mode (`?poster=1`) is how the fallback picture is rendered: the page strips itself down to the
  // gem on a transparent background, and a script screenshots it once `data-gem-ready` appears.
  useEffect(() => {
    if (!poster) return;
    const root = document.documentElement;
    root.dataset.immersivePoster = "1";
    return () => {
      delete root.dataset.immersivePoster;
      delete root.dataset.gemReady;
    };
  }, [poster]);
  useEffect(() => {
    if (poster && ready) document.documentElement.dataset.gemReady = "1";
  }, [poster, ready]);

  const liveGemVisible = showCanvas && ready;

  return (
    <>
      <div ref={anchorRef} id={GEM_ANCHOR_ID} data-gem-anchor className={cn("relative aspect-square", className)}>
        <Image
          src="/immersive/gem-poster.png"
          alt=""
          width={1024}
          height={1024}
          priority
          sizes="(min-width: 1024px) 46rem, 90vw"
          className={cn(
            "size-full object-contain transition-opacity duration-500",
            liveGemVisible && !poster ? "opacity-0" : "opacity-100"
          )}
        />
      </div>
      {showCanvas &&
        createPortal(
          <StageCanvas
            tier={tier}
            active={inView && tabVisible}
            poster={poster}
            onReady={() => setReady(true)}
            onDecline={() => setDowngraded(downgradeTier(tier))}
          />,
          document.body
        )}
    </>
  );
}
