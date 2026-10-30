"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatBubble } from "@/features/support/components/ChatBubble";
import { usePolling } from "@/hooks/use-polling";
import { sendSupportMessage, markSupportRead } from "@/actions/support.actions";
import { formatMessageTime } from "@/utils/format-time";
import { SUPPORT_MESSAGE_MAX_LENGTH, type SupportMessageDTO, type UserThreadDTO } from "@/features/support/types";

const THREAD_POLL_MS = 4_000;

interface PendingMessage {
  tempId: string;
  body: string;
  createdAt: string;
}

export function LiveChatView({ onUnreadCleared }: { onUnreadCleared: () => void }) {
  const [thread, setThread] = useState<UserThreadDTO | null>(null);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  const load = useCallback(async () => {
    const response = await fetch("/api/support/thread", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as UserThreadDTO;
    setThread(data);
    if (data.userUnreadCount > 0) {
      await markSupportRead();
      onUnreadCleared();
    }
  }, [onUnreadCleared]);

  usePolling(load, THREAD_POLL_MS);

  const messageCount = (thread?.messages.length ?? 0) + pending.length;
  useEffect(() => {
    // Only jump to the bottom when something new arrived, so scrolling up to reread isn't fought.
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
    setPending((prev) => [...prev, { tempId, body, createdAt: new Date().toISOString() }]);

    const result = await sendSupportMessage(body);
    setPending((prev) => prev.filter((p) => p.tempId !== tempId));

    if ("error" in result) {
      toast.error(result.error);
      setDraft((current) => current || body);
      return;
    }
    const sent: SupportMessageDTO = result.message;
    setThread((prev) => {
      const base = prev ?? { status: "open" as const, userUnreadCount: 0, messages: [] };
      if (base.messages.some((m) => m.id === sent.id)) return base;
      return { ...base, status: "open", messages: [...base.messages, sent] };
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  const messages = thread?.messages ?? [];

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Conversation with our team">
        {thread === null && <p className="text-center text-sm text-muted-foreground">Loading conversation...</p>}

        {thread !== null && messages.length === 0 && pending.length === 0 && (
          <p className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
            Send us a message and our team will reply here. You&apos;ll see a notification on the chat button when they do.
          </p>
        )}

        {messages.map((message) => (
          <ChatBubble key={message.id} own={message.senderRole === "user"} time={formatMessageTime(message.createdAt)}>
            {message.body}
          </ChatBubble>
        ))}
        {pending.map((message) => (
          <div key={message.tempId} className="opacity-60">
            <ChatBubble own>{message.body}</ChatBubble>
          </div>
        ))}

        {thread?.status === "closed" && (
          <p className="text-center text-xs text-muted-foreground">
            This conversation was marked as resolved. Send a message to reopen it.
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            aria-label="Message to our team"
            rows={2}
            maxLength={SUPPORT_MESSAGE_MAX_LENGTH}
            className="max-h-28 min-h-0 resize-none"
          />
          <Button type="button" size="icon" aria-label="Send message" disabled={!draft.trim()} onClick={() => void send()}>
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Enter to send, Shift+Enter for a new line.</p>
      </div>
    </>
  );
}
