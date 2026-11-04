import { useSyncExternalStore } from "react";

/**
 * Whether the full-screen menu is open.
 *
 * The menu button, the overlay and the 3D scene all need to know (the scene pauses while the menu covers
 * it), and they sit in different parts of the tree. A tiny shared value is simpler than lifting state
 * through unrelated components or adding a context provider around the page.
 */
let open = false;
const listeners = new Set<() => void>();

export function getMenuOpen(): boolean {
  return open;
}

export function setMenuOpen(next: boolean): void {
  if (open === next) return;
  open = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMenuOpen(): boolean {
  return useSyncExternalStore(subscribe, getMenuOpen, () => false);
}
