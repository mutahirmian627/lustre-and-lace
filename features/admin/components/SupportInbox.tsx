"use client";

import { useCallback, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SupportThreadPane } from "@/features/admin/components/SupportThreadPane";
import { usePolling } from "@/hooks/use-polling";
import { formatRelativeTime } from "@/utils/format-time";
import { cn } from "@/lib/utils";
import type { AdminConversationSummary } from "@/features/support/types";

const LIST_POLL_MS = 8_000;

export function SupportInbox() {
  const [conversations, setConversations] = useState<AdminConversationSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const response = await fetch("/api/admin/support/conversations", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { conversations: AdminConversationSummary[] };
    setConversations(data.conversations);

    // On a wide screen there's room for the thread, so open the most urgent one; on a phone, start at the list.
    setSelectedId((current) =>
      current === null && data.conversations.length > 0 && window.matchMedia("(min-width: 768px)").matches
        ? data.conversations[0].id
        : current
    );
  }, []);

  usePolling(loadList, LIST_POLL_MS);

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[26rem] overflow-hidden rounded-lg border border-border">
      <aside
        className={cn(
          "w-full shrink-0 overflow-y-auto border-border md:block md:w-80 md:border-r",
          selectedId ? "hidden" : "block"
        )}
        aria-label="Conversations"
      >
        {conversations === null && <p className="p-4 text-sm text-muted-foreground">Loading...</p>}
        {conversations?.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <MessageSquare className="size-8" aria-hidden="true" />
            <p>No conversations yet. When a customer writes to you from the site, it shows up here.</p>
          </div>
        )}
        <ul>
          {conversations?.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                aria-current={conversation.id === selectedId}
                className={cn(
                  "block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted",
                  conversation.id === selectedId && "bg-accent"
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm text-foreground", conversation.adminUnreadCount > 0 && "font-semibold")}>
                    {conversation.userName}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(conversation.lastMessageAt)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">{conversation.lastMessagePreview ?? "No messages"}</span>
                  {conversation.adminUnreadCount > 0 ? (
                    <span
                      aria-label={`${conversation.adminUnreadCount} unread`}
                      className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-white"
                    >
                      {conversation.adminUnreadCount}
                    </span>
                  ) : (
                    conversation.status === "closed" && <Badge variant="secondary">Resolved</Badge>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className={cn("min-w-0 flex-1 flex-col", selectedId ? "flex" : "hidden md:flex")} aria-label="Selected conversation">
        {selectedId ? (
          <SupportThreadPane
            key={selectedId}
            conversationId={selectedId}
            onBack={() => setSelectedId(null)}
            onChanged={loadList}
          />
        ) : (
          <p className="m-auto p-6 text-sm text-muted-foreground">Select a conversation to read and reply.</p>
        )}
      </section>
    </div>
  );
}
