"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { saveInquiryNotes, updateInquiryStatus } from "@/actions/admin/inquiries.actions";
import type { InquiryStatus } from "@/constants/inquiry-status";
import { SERVICES } from "@/constants/agency";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  won: "Won",
  closed: "Closed",
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "bg-primary/10 text-primary",
  in_progress: "bg-champagne text-plum",
  won: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
};

export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string;
  industry: string | null;
  services: string[];
  budgetRange: string | null;
  existingWebsite: string | null;
  message: string;
  status: InquiryStatus;
  adminNotes: string | null;
  createdAt: Date;
}

function whatsappHref(phone: string) {
  let digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

export function InquiryCard({ inquiry }: { inquiry: InquiryRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(inquiry.adminNotes ?? "");

  function changeStatus(status: InquiryStatus) {
    startTransition(async () => {
      try {
        await updateInquiryStatus(inquiry.id, status);
        toast.success(`Marked as ${STATUS_LABELS[status].toLowerCase()}`);
        router.refresh();
      } catch {
        toast.error("Couldn't update the status.");
      }
    });
  }

  function saveNotes() {
    startTransition(async () => {
      try {
        await saveInquiryNotes(inquiry.id, notes);
        toast.success("Notes saved");
        router.refresh();
      } catch {
        toast.error("Couldn't save the notes.");
      }
    });
  }

  const serviceTitles = inquiry.services.map((slug) => SERVICES.find((s) => s.slug === slug)?.title ?? slug);

  return (
    <article className="space-y-4 rounded-xl border border-border bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg text-foreground">{inquiry.businessName}</h3>
          <p className="text-sm text-muted-foreground">
            {inquiry.name}
            {inquiry.industry ? ` · ${inquiry.industry}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLES[inquiry.status])}>
            {STATUS_LABELS[inquiry.status]}
          </span>
          <time className="text-xs text-muted-foreground" dateTime={inquiry.createdAt.toISOString()}>
            {inquiry.createdAt.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
          </time>
        </div>
      </header>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Interested in</dt>
          <dd className="text-foreground">{serviceTitles.join(", ") || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Budget</dt>
          <dd className="text-foreground">{inquiry.budgetRange || "—"}</dd>
        </div>
        {inquiry.existingWebsite && (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Current website / page</dt>
            <dd className="break-all text-foreground">{inquiry.existingWebsite}</dd>
          </div>
        )}
      </dl>

      <p className="whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-foreground">
        {inquiry.message}
      </p>

      <div className="flex flex-wrap gap-2">
        <a
          href={`mailto:${inquiry.email}?subject=${encodeURIComponent("Your project enquiry — Lustre & Lace")}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm transition-colors hover:border-primary hover:text-primary"
        >
          <Mail className="size-4" aria-hidden="true" />
          {inquiry.email}
        </a>
        {inquiry.phone && (
          <>
            <a
              href={`tel:${inquiry.phone}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              <Phone className="size-4" aria-hidden="true" />
              {inquiry.phone}
            </a>
            <a
              href={whatsappHref(inquiry.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
          </>
        )}
      </div>

      <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[auto_1fr]">
        <label className="space-y-1 text-xs uppercase tracking-wider text-muted-foreground">
          Status
          <select
            value={inquiry.status}
            disabled={pending}
            onChange={(e) => changeStatus(e.target.value as InquiryStatus)}
            className="block h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm normal-case tracking-normal text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {(Object.keys(STATUS_LABELS) as InquiryStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-2">
          <label htmlFor={`notes-${inquiry.id}`} className="text-xs uppercase tracking-wider text-muted-foreground">
            Private notes
          </label>
          <Textarea
            id={`notes-${inquiry.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Quote sent, follow-up date, anything to remember…"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || notes.trim() === (inquiry.adminNotes ?? "")}
            onClick={saveNotes}
          >
            Save notes
          </Button>
        </div>
      </div>
    </article>
  );
}
