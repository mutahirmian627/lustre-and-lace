"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChatBubble } from "@/features/support/components/ChatBubble";
import { useSupportUnread } from "@/features/admin/components/SupportUnreadProvider";
import { usePolling } from "@/hooks/use-polling";
import { markConversationRead, sendAdminReply, setConversationStatus } from "@/actions/admin/support.actions";
import { formatMessageTime } from "@/utils/format-time";
import { SUPPORT_MESSAGE_MAX_LENGTH, type AdminThreadDTO } from "@/features/support/types";

const THREAD_POLL_MS = 4_000;

interface PendingReply {
  tempId: string;
  body: string;
}

/** Remounted per conversation (keyed by id), so switching customers resets all polling and draft state. */
export function SupportThreadPane({
  conversationId,
  onBack,
  onChanged,
}: {
  conversationId: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const { refresh: refreshUnread } = useSupportUnread();
  const [thread, setThread] = useState<AdminThreadDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pending, setPending] = useState<PendingReply[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/support/conversations/${conversationId}`, { cache: "no-store" });
    if (response.status === 404) {
      setNotFound(true);
      return;
    }
    if (!response.ok) return;

    const data = (await response.json()) as AdminThreadDTO;
    setThread(data);
    if (data.conversation.adminUnreadCount > 0) {
      await markConversationRead(conversationId);
      await refreshUnread();
      onChanged();
    }
  }, [conversationId, refreshUnread, onChanged]);

  usePolling(load, THREAD_POLL_MS);

  const messageCount = (thread?.messages.length ?? 0) + pending.length;
  useEffect(() => {
    if (messageCount !== lastCountRef.current) {
      lastCountRef.current = messageCount;
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messageCount]);

  async function send() {
    const body = draft.trim();
    if (!body) return;

    const tempId = `pending-${crypto.randomUUID()}`;
    setDraft("");
    setPending((prev) => [...prev, { tempId, body }]);

    const result = await sendAdminReply(conversationId, body);
    setPending((prev) => prev.filter((p) => p.tempId !== tempId));

    if ("error" in result) {
      toast.error(result.error);
      setDraft((current) => current || body);
      return;
    }
    const sent = result.message;
    setThread((prev) =>
      prev && !prev.messages.some((m) => m.id === sent.id)
        ? { ...prev, messages: [...prev.messages, sent] }
        : prev
    );
    onChanged();
  }

  async function toggleStatus() {
    if (!thread) return;
    const next = thread.conversation.status === "open" ? "closed" : "open";
    const result = await setConversationStatus(conversationId, next);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(next === "closed" ? "Conversation marked as resolved." : "Conversation reopened.");
    await load();
    onChanged();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  if (notFound) {
    return <p className="p-6 text-sm text-muted-foreground">This conversation no longer exists.</p>;
  }
  if (!thread) {
    return <p className="p-6 text-sm text-muted-foreground">Loading conversation...</p>;
  }

  const { conversation, messages } = thread;
  const isClosed = conversation.status === "closed";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-2 border-b border-border p-3">
        <Button type="button" variant="ghost" size="icon-sm" className="md:hidden" aria-label="Back to conversations" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <span className="truncate">{conversation.userName}</span>
            {isClosed && <Badge variant="secondary">Resolved</Badge>}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.userEmail}
            {conversation.userPhone ? ` · ${conversation.userPhone}` : ""}
          </p>
          <Link href={`/admin/customers/${conversation.userId}`} className="text-xs text-primary hover:underline">
            View customer and orders
          </Link>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={toggleStatus}>
          {isClosed ? <RotateCcw className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
          {isClosed ? "Reopen" : "Mark resolved"}
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((message) => (
          <ChatBubble key={message.id} own={message.senderRole === "admin"} time={formatMessageTime(message.createdAt)}>
            {message.body}
          </ChatBubble>
        ))}
        {pending.map((message) => (
          <div key={message.tempId} className="opacity-60">
            <ChatBubble own>{message.body}</ChatBubble>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Reply to ${conversation.userName}...`}
            aria-label={`Reply to ${conversation.userName}`}
            rows={2}
            maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
            className="max-h-32 min-h-0 resize-none"
          />
          <Button type="button" size="icon" aria-label="Send reply" disabled={!draft.trim()} onClick={() => void send()}>
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Enter to send, Shift+Enter for a new line.</p>
      </div>
    </div>
  );
}
