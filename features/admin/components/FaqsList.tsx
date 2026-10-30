"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaqFormDialog } from "@/features/admin/components/FaqFormDialog";
import { deleteFaq, toggleFaqActive } from "@/actions/admin/faqs.actions";
import type { faqs } from "@/db/schema";

type Faq = typeof faqs.$inferSelect;

export function FaqsList({ faqs: allFaqs }: { faqs: Faq[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const result = await deleteFaq(id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Quick answer deleted.");
    router.refresh();
  }

  async function handleToggle(faq: Faq) {
    const result = await toggleFaqActive(faq.id, !faq.isActive);
    if ("error" in result) toast.error(result.error);
    else router.refresh();
  }

  if (allFaqs.length === 0) {
    return (
      <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
        No quick answers yet. Add the questions customers ask most — they get an instant reply with no waiting.
      </p>
    );
  }

  return (
    <ul className="rounded-lg border border-border px-4">
      {allFaqs.map((faq) => (
        <li key={faq.id} className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-foreground">
              {faq.question}
              {!faq.isActive && <Badge variant="secondary">Hidden</Badge>}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{faq.answer}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleToggle(faq)}>
              {faq.isActive ? "Hide" : "Show"}
            </Button>
            <FaqFormDialog
              faq={faq}
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${faq.question}`}>
                  <Pencil className="size-4" />
                </Button>
              }
            />
            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${faq.question}`} onClick={() => handleDelete(faq.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
