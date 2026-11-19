"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Camera, MessageCircle, Send, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/features/support/components/ChatBubble";
import { findBestFaq } from "@/features/support/faq-match";
import { STUDIO_GREETING, STUDIO_NO_MATCH, buildStudioFaqs, type StudioFaq } from "@/features/studio-chat/faqs";

interface Entry {
  id: string;
  from: "bot" | "user";
  text: string;
  links?: { label: string; href: string }[];
}

let entryCounter = 0;
const nextId = () => `studio-entry-${++entryCounter}`;

export function StudioChatPanel({
  whatsappHref,
  instagramHref,
  onClose,
}: {
  whatsappHref: string | null;
  instagramHref: string | null;
  onClose: () => void;
}) {
  const faqs = useMemo(() => buildStudioFaqs(), []);
  const [entries, setEntries] = useState<Entry[]>([{ id: "greeting", from: "bot", text: STUDIO_GREETING }]);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [entries]);

  function answer(faq: StudioFaq, asText: string) {
    setAsked((prev) => new Set(prev).add(faq.id));
    setEntries((prev) => [
      ...prev,
      { id: nextId(), from: "user", text: asText },
      { id: nextId(), from: "bot", text: faq.answer, links: faq.links },
    ]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    const match = findBestFaq(text, faqs);
    if (match) {
      answer(faqs.find((faq) => faq.id === match.id)!, text);
    } else {
      setEntries((prev) => [
        ...prev,
        { id: nextId(), from: "user", text },
        { id: nextId(), from: "bot", text: STUDIO_NO_MATCH, links: [{ label: "Start a project", href: "/studio/get-started" }] },
      ]);
    }
  }

  const remaining = faqs.filter((faq) => !asked.has(faq.id));

  return (
    <div
      role="dialog"
      aria-label="Chat with Aperionie"
      className="fixed inset-x-2 bottom-2 top-16 z-[55] flex flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-xl sm:inset-x-auto sm:bottom-20 sm:right-4 sm:top-auto sm:h-[34rem] sm:max-h-[calc(100dvh-6rem)] sm:w-[22rem]"
    >
      <div className="flex items-center gap-2 border-b border-border bg-secondary px-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base text-secondary-foreground">Ask about our services</p>
          <p className="text-xs text-secondary-foreground/70">Quick answers about packages and how we work</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close chat" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite" aria-label="Chat messages">
        {entries.map((entry) => (
          <ChatBubble key={entry.id} own={entry.from === "user"}>
            {entry.text}
            {entry.links && entry.links.length > 0 && (
              <span className="mt-2 flex flex-wrap gap-2">
                {entry.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-primary px-3 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </Link>
                ))}
              </span>
            )}
          </ChatBubble>
        ))}
        <div ref={endRef} />
      </div>

      <div className="space-y-2 border-t border-border p-3">
        <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto" role="group" aria-label="Suggested questions">
          {remaining.map((faq) => (
            <button
              key={faq.id}
              type="button"
              onClick={() => answer(faq, faq.question)}
              className="rounded-full border border-border px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {faq.question}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about our services"
            aria-label="Ask about our services"
            maxLength={200}
          />
          <Button type="submit" size="icon" aria-label="Send question" disabled={!input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {/* Real links styled as buttons (the Button component would announce them to screen readers as buttons). */}
          <Link href="/studio/get-started" onClick={onClose} className={cn(buttonVariants({ size: "sm" }), "flex-1")}>
            Start a project
          </Link>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          {instagramHref && (
            <a
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              <Camera className="size-4" aria-hidden="true" />
              Instagram<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
