import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getAdminFaqs } from "@/actions/admin/faqs.actions";
import { SupportSubnav } from "@/features/admin/components/SupportSubnav";
import { FaqsList } from "@/features/admin/components/FaqsList";
import { FaqFormDialog } from "@/features/admin/components/FaqFormDialog";

export const metadata: Metadata = { title: "Admin — Quick Answers" };

export default async function AdminFaqsPage() {
  const faqs = await getAdminFaqs();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-foreground">Support</h2>
        <FaqFormDialog trigger={<Button>+ New Quick Answer</Button>} />
      </div>
      <SupportSubnav active="/admin/support/faqs" />
      <p className="text-sm text-muted-foreground">
        These appear in the customer chat as tappable questions and are also matched against what customers type.
        Anyone can read them without an account, so keep them general — nothing about a specific order or customer.
      </p>
      <FaqsList faqs={faqs} />
    </div>
  );
}
