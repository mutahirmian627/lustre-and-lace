"use client";

import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBotView } from "@/features/support/components/ChatBotView";
import { LiveChatView } from "@/features/support/components/LiveChatView";

export type ChatView = "bot" | "live";

/** The view is owned by the launcher so closing and reopening the chat picks up where the customer left off. */
export function SupportChatPanel({
  isLoggedIn,
  view,
  onViewChange,
  onClose,
  onUnreadCleared,
}: {
  isLoggedIn: boolean;
  view: ChatView;
  onViewChange: (view: ChatView) => void;
  onClose: () => void;
  onUnreadCleared: () => void;
}) {
  const setView = onViewChange;

  return (
    <div
      role="dialog"
      aria-label="Chat with Lustre & Lace"
      className="fixed inset-x-2 bottom-2 top-16 z-40 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl sm:inset-x-auto sm:bottom-20 sm:right-4 sm:top-auto sm:h-[34rem] sm:max-h-[calc(100dvh-6rem)] sm:w-[22rem]"
    >
      <div className="flex items-center gap-2 border-b border-border bg-secondary px-3 py-3">
        {view === "live" && (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Back to quick answers" onClick={() => setView("bot")}>
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base text-secondary-foreground">
            {view === "bot" ? "How can we help?" : "Chat with our team"}
          </p>
          <p className="text-xs text-secondary-foreground/70">
            {view === "bot" ? "Quick answers, or talk to a person" : "We reply here as soon as we can"}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close chat" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {view === "bot" ? (
        <ChatBotView isLoggedIn={isLoggedIn} onTalkToTeam={() => setView("live")} />
      ) : (
        <LiveChatView onUnreadCleared={onUnreadCleared} />
      )}
    </div>
  );
}
