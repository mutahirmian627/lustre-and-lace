import { useSyncExternalStore } from "react";

/**
 * A way for the 3D homepage's full-screen menu to open the chat (they sit in different parts of the page, like the menu's own
 * open state in features/immersive/lib/menu-store.ts). Each request bumps a counter; the chat opens when the counter moves.
 */
let requests = 0;
const listeners = new Set<() => void>();

export function requestChatOpen(): void {
  requests += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** How many times something has asked for the chat to open. */
export function useChatOpenRequests(): number {
  return useSyncExternalStore(subscribe, () => requests, () => 0);
}
