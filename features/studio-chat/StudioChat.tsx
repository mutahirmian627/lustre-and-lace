"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatOpenRequests } from "@/features/studio-chat/chat-store";

// The panel (messages, matching, the question list) loads the first time the chat is opened, so the page pays for a button only.
const StudioChatPanel = dynamic(() => import("@/features/studio-chat/StudioChatPanel").then((m) => m.StudioChatPanel), {
  ssr: false,
});

export interface StudioChatProps {
  /** A wa.me link with a hello already typed, when the studio has a WhatsApp number. */
  whatsappHref?: string | null;
  instagramHref?: string | null;
  /**
   * "studio": the studio pages (on phones a "Start your project" bar can sit along the bottom, so the button sits above it).
   * "home": the 3D homepage (its full-screen menu makes the button inert while it is open).
   */
  variant?: "studio" | "home";
}

/** Quick answers for people interested in the studio's services: a round button that opens a small panel. */
export function StudioChat({ whatsappHref = null, instagramHref = null, variant = "studio" }: StudioChatProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const barPossible = variant === "studio" && pathname !== "/studio/get-started";
  // Something else on the page (the homepage's menu) can ask for the chat to open.
  const openRequests = useChatOpenRequests();
  useEffect(() => {
    if (openRequests > 0) setOpen(true);
  }, [openRequests]);

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
    // On the 3D homepage there is no studio wrapper, so the chat carries the studio's colours itself (studio-theme-scope).
    <div {...(variant === "home" ? { "data-immersive-background": "", className: "studio-theme-scope" } : {})}>
      {open && (
        <StudioChatPanel whatsappHref={whatsappHref} instagramHref={instagramHref} onClose={close} />
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? "Close chat" : "Open chat: ask about our services"}
        aria-expanded={open}
        className={cn(
          "fixed bottom-4 right-4 z-[55] flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none",
          // The pinned "Start your project" bar is 4.5rem tall on phones.
          barPossible && "max-md:bottom-[5.5rem]",
          // On small phones the 3D homepage's text runs to the corner, so there the button steps aside (immersive.css) and the
          // chat opens from the menu instead.
          variant === "home" && "studio-chat-launcher--home",
          open && "max-sm:hidden"
        )}
      >
        {open ? <X className="size-6" aria-hidden="true" /> : <MessageCircle className="size-6" aria-hidden="true" />}
      </button>
    </div>
  );
}
