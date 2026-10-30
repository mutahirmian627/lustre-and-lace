"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { usePolling } from "@/hooks/use-polling";
import { cn } from "@/lib/utils";

import type { ChatView } from "@/features/support/components/SupportChatPanel";

// The panel (message list, FAQ matching, polling) only loads the first time the chat is opened.
const SupportChatPanel = dynamic(
  () => import("@/features/support/components/SupportChatPanel").then((m) => m.SupportChatPanel),
  { ssr: false }
);

const UNREAD_POLL_MS = 30_000;

export function SupportChatLauncher({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [view, setView] = useState<ChatView>("bot");
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The product page pins an Add to Cart bar to the bottom on phones; sit above it instead of covering it.
  const onProductPage = /^\/products\/[^/]+/.test(usePathname());

  // Only a signed-in customer can have replies waiting, and the open panel keeps its own count.
  usePolling(
    async () => {
      const response = await fetch("/api/support/unread", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { count: number };
      setUnread(data.count);
    },
    UNREAD_POLL_MS,
    isLoggedIn && !open
  );

  function openChat() {
    // A waiting reply is the reason they came back, so show it instead of the quick-answers screen.
    if (unread > 0) setView("live");
    setOpen(true);
  }

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  return (
    <>
      {open && (
        <SupportChatPanel
          isLoggedIn={isLoggedIn}
          view={view}
          onViewChange={setView}
          onClose={close}
          onUnreadCleared={() => setUnread(0)}
        />
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : openChat())}
        aria-label={open ? "Close chat" : unread > 0 ? `Open chat, ${unread} new message${unread === 1 ? "" : "s"}` : "Open chat"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-4 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none",
          onProductPage && "max-md:bottom-20",
          open && "max-sm:hidden"
        )}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {!open && unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
