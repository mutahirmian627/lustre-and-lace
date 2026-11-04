/**
 * Where the cursor is, as -1..1 in both directions (up and right are positive).
 *
 * The 3D canvas sits above the page with pointer events switched off so links and the form stay
 * clickable, which means the canvas can't hear the mouse itself. This tiny shared object is updated by
 * one window listener and read by the scene every frame; no React state, so moving the mouse never
 * re-renders anything.
 */
export const pointer = { x: 0, y: 0 };

export function trackPointer(): () => void {
  function onMove(event: PointerEvent) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  return () => window.removeEventListener("pointermove", onMove);
}
