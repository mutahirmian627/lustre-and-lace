"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Even a page that is ready instantly shows the bar for this long, so the switch reads as one smooth motion. */
const MIN_VISIBLE_MS = 280;
/** How long the finished bar takes to fade away. */
const FADE_MS = 240;
/** Safety net: if a navigation never completes (offline, interrupted), stop pretending after this long. */
const GIVE_UP_MS = 12_000;

type Phase = "idle" | "loading" | "finishing";

/**
 * A thin, brand-coloured progress bar across the top of the screen while the app moves from one page
 * to the next. It starts on a click on an internal link (or the browser's back/forward buttons) and
 * completes when the new page has rendered. Navigations triggered from code (for example after
 * signing in) have no click to catch, so they get a short sweep when the new page appears.
 */
function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);

  const startedAt = useRef(0);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const running = useRef(false);

  const clearTimers = useCallback(() => {
    if (trickle.current) clearInterval(trickle.current);
    trickle.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const start = useCallback(() => {
    if (running.current) return;
    running.current = true;
    clearTimers();
    startedAt.current = Date.now();
    setPhase("loading");
    setProgress(12);
    // Creep towards (never reaching) the end while the next page loads.
    trickle.current = setInterval(() => {
      setProgress((value) => value + (88 - value) * 0.12);
    }, 140);
    later(() => finish(), GIVE_UP_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback(() => {
    if (!running.current) {
      // Navigated from code, with no click to catch: give it a quick sweep of its own.
      running.current = true;
      clearTimers();
      startedAt.current = Date.now();
      setPhase("loading");
      setProgress(35);
    }
    if (trickle.current) clearInterval(trickle.current);
    trickle.current = null;

    const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt.current));
    later(() => {
      setPhase("finishing");
      setProgress(100);
      later(() => {
        setPhase("idle");
        setProgress(0);
        running.current = false;
      }, FADE_MS);
    }, wait);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The new page is in place.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  // A navigation is about to start.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    }
    function onPopState() {
      start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [start, clearTimers]);

  return (
    <div
      aria-hidden="true"
      data-route-progress={phase}
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity ease-out motion-reduce:transition-none"
      style={{ opacity: phase === "idle" ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-primary via-gold to-primary shadow-[0_0_10px_rgb(175_80_113/0.55)] transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function RouteProgress() {
  // useSearchParams needs a Suspense boundary so it doesn't opt every page out of static rendering.
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
