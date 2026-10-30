"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Package, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/features/support/components/ChatBubble";
import { OrderStatusCard } from "@/features/support/components/OrderStatusCard";
import { findBestFaq } from "@/features/support/faq-match";
import { extractOrderReference, looksLikeOrderStatusQuestion } from "@/features/support/order-status";
import { lookupOrderStatus } from "@/actions/support.actions";
import type { FaqDTO, OrderStatusLookupResult } from "@/features/support/types";

type Entry =
  | { id: string; from: "bot" | "user"; kind: "text"; text: string }
  | { id: string; from: "bot"; kind: "loading" }
  | { id: string; from: "bot"; kind: "order"; result: Extract<OrderStatusLookupResult, { ok: true }> }
  | { id: string; from: "bot"; kind: "signin" };

const GREETING: Entry = {
  id: "greeting",
  from: "bot",
  kind: "text",
  text: "Hi, welcome to Lustre & Lace. Pick a question below, type your own, or enter an order number to check its status.",
};

const NO_MATCH_TEXT =
  "I couldn't find an answer to that. You can try rephrasing, or talk to our team and they'll help you directly.";

const ORDER_PROMPT_TEXT =
  "Sure. Type your order number and I'll look it up. It looks like LL-2026-00013 and is in your confirmation email. No sign-in needed.";

let entryCounter = 0;
const nextId = () => `entry-${++entryCounter}`;

export function ChatBotView({
  isLoggedIn,
  onTalkToTeam,
}: {
  isLoggedIn: boolean;
  onTalkToTeam: () => void;
}) {
  const [faqs, setFaqs] = useState<FaqDTO[] | null>(null);
  const [entries, setEntries] = useState<Entry[]>([GREETING]);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/support/faqs")
      .then((r) => (r.ok ? r.json() : { faqs: [] }))
      .then((data: { faqs: FaqDTO[] }) => !cancelled && setFaqs(data.faqs))
      .catch(() => !cancelled && setFaqs([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [entries]);

  function push(...next: Entry[]) {
    setEntries((prev) => [...prev, ...next]);
  }

  function replaceEntry(id: string, next: Entry) {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? next : entry)));
  }

  function askFaq(faq: FaqDTO) {
    setAsked((prev) => new Set(prev).add(faq.id));
    push(
      { id: nextId(), from: "user", kind: "text", text: faq.question },
      { id: nextId(), from: "bot", kind: "text", text: faq.answer }
    );
  }

  function askForOrderNumber() {
    push(
      { id: nextId(), from: "user", kind: "text", text: "Check my order status" },
      { id: nextId(), from: "bot", kind: "text", text: ORDER_PROMPT_TEXT }
    );
    inputRef.current?.focus();
  }

  async function checkOrder(text: string) {
    const loadingId = nextId();
    push({ id: nextId(), from: "user", kind: "text", text }, { id: loadingId, from: "bot", kind: "loading" });

    try {
      const result = await lookupOrderStatus(text);
      replaceEntry(
        loadingId,
        result.ok
          ? { id: loadingId, from: "bot", kind: "order", result }
          : { id: loadingId, from: "bot", kind: "text", text: result.message }
      );
    } catch {
      replaceEntry(loadingId, {
        id: loadingId,
        from: "bot",
        kind: "text",
        text: "Sorry, I couldn't check that right now. Please try again in a moment.",
      });
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");

    if (extractOrderReference(text)) {
      void checkOrder(text);
      return;
    }
    if (looksLikeOrderStatusQuestion(text)) {
      push(
        { id: nextId(), from: "user", kind: "text", text },
        { id: nextId(), from: "bot", kind: "text", text: ORDER_PROMPT_TEXT }
      );
      return;
    }

    const match = findBestFaq(text, faqs ?? []);
    if (match) {
      setAsked((prev) => new Set(prev).add(match.id));
      push(
        { id: nextId(), from: "user", kind: "text", text },
        { id: nextId(), from: "bot", kind: "text", text: match.answer }
      );
    } else {
      push(
        { id: nextId(), from: "user", kind: "text", text },
        { id: nextId(), from: "bot", kind: "text", text: NO_MATCH_TEXT }
      );
    }
  }

  function handleTalkToTeam() {
    if (isLoggedIn) {
      onTalkToTeam();
      return;
    }
    push({ id: nextId(), from: "bot", kind: "signin" });
  }

  const remaining = (faqs ?? []).filter((faq) => !asked.has(faq.id));
  const redirect = encodeURIComponent(
    typeof window === "undefined" ? "/" : window.location.pathname + window.location.search
  );

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Chat messages">
        {entries.map((entry) => {
          switch (entry.kind) {
            case "signin":
              return (
                <ChatBubble key={entry.id} own={false}>
                  <p>Please sign in so our team knows who they&apos;re talking to. Your cart will be waiting.</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" nativeButton={false} render={<Link href={`/login?redirect=${redirect}`} />}>
                      Sign in
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={`/register?redirect=${redirect}`} />}
                    >
                      Create account
                    </Button>
                  </div>
                </ChatBubble>
              );
            case "loading":
              return (
                <ChatBubble key={entry.id} own={false}>
                  <span className="text-muted-foreground">Looking that up...</span>
                </ChatBubble>
              );
            case "order":
              return (
                <ChatBubble key={entry.id} own={false}>
                  <OrderStatusCard result={entry.result} />
                </ChatBubble>
              );
            default:
              return (
                <ChatBubble key={entry.id} own={entry.from === "user"}>
                  {entry.text}
                </ChatBubble>
              );
          }
        })}
        <div ref={endRef} />
      </div>

      <div className="space-y-2 border-t border-border p-3">
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto" aria-label="Suggested questions">
          <button
            type="button"
            onClick={askForOrderNumber}
            className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/5 px-3 py-1 text-left text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <Package className="size-3.5" aria-hidden="true" />
            Check my order status
          </button>
          {remaining.map((faq) => (
            <button
              key={faq.id}
              type="button"
              onClick={() => askFaq(faq)}
              className="rounded-full border border-border px-3 py-1 text-left text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {faq.question}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask, or enter an order number"
            aria-label="Ask, or enter an order number"
            maxLength={200}
          />
          <Button type="submit" size="icon" aria-label="Send question" disabled={!input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>

        <Button type="button" variant="outline" className="w-full" onClick={handleTalkToTeam}>
          Talk to our team
        </Button>
      </div>
    </>
  );
}
