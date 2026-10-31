"use client";

import { useEffect } from "react";

const REFRESH_EVERY_MS = 4 * 60 * 1000;

/**
 * The signed session cookie that lets pages skip a database lookup only lives 5 minutes, and it
 * can only be renewed by a request to the auth API (a page render can't set cookies). Pinging the
 * session endpoint a little more often than that keeps every page fast for a signed-in visitor, and
 * keeps the middleware's view of "who is signed in" current.
 */
export function SessionKeepAlive() {
  useEffect(() => {
    let last = Date.now();

    function refresh() {
      last = Date.now();
      fetch("/api/auth/get-session", { credentials: "same-origin", cache: "no-store" }).catch(() => {});
    }
    function onVisible() {
      if (document.visibilityState === "visible" && Date.now() - last > REFRESH_EVERY_MS - 60_000) refresh();
    }

    const timer = setInterval(refresh, REFRESH_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
