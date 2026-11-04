/**
 * Runs `task` once, at the first of: the browser going idle, the visitor scrolling, or the visitor touching
 * or moving over the page. Used to start loading code that is needed soon but not for the first paint, so
 * it never competes with the headline and the first image for the main thread.
 *
 * Returns a cancel function. Browser only.
 */
export function whenNeeded(task: () => void, { idleTimeout = 2000 }: { idleTimeout?: number } = {}): () => void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    task();
  };

  const events: (keyof WindowEventMap)[] = ["scroll", "pointerdown", "keydown", "touchstart"];
  events.forEach((name) => window.addEventListener(name, run, { passive: true, once: true }));

  const idleHandle =
    typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(run, { timeout: idleTimeout }) : null;
  const timeoutHandle = idleHandle === null ? window.setTimeout(run, 800) : null;

  function cleanup() {
    events.forEach((name) => window.removeEventListener(name, run));
    if (idleHandle !== null) window.cancelIdleCallback(idleHandle);
    if (timeoutHandle !== null) window.clearTimeout(timeoutHandle);
  }

  return () => {
    done = true;
    cleanup();
  };
}
