import type { Metadata } from "next";
import Link from "next/link";
import { getInquiries, getInquiryCounts } from "@/actions/admin/inquiries.actions";
import { INQUIRY_STATUSES, type InquiryStatus } from "@/constants/inquiry-status";
import { InquiryCard, STATUS_LABELS } from "@/features/admin/components/InquiryCard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Enquiries" };

export default async function AdminInquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusParam } = await searchParams;
  const status = INQUIRY_STATUSES.find((s) => s === statusParam) as InquiryStatus | undefined;

  const [inquiries, counts] = await Promise.all([getInquiries(status), getInquiryCounts()]);

  const tabs: { label: string; href: string; count: number; active: boolean }[] = [
    { label: "All", href: "/admin/inquiries", count: counts.all, active: !status },
    ...INQUIRY_STATUSES.map((s) => ({
      label: STATUS_LABELS[s],
      href: `/admin/inquiries?status=${s}`,
      count: counts[s],
      active: status === s,
    })),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl text-foreground">Project enquiries</h2>
        <p className="text-sm text-muted-foreground">People who filled in the form on the Start a project page.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border pb-2" role="tablist" aria-label="Enquiry status">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            role="tab"
            aria-selected={tab.active}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab.active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label} <span className="text-xs opacity-70">{tab.count}</span>
          </Link>
        ))}
      </div>

      {inquiries.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {status ? `No ${STATUS_LABELS[status].toLowerCase()} enquiries.` : "No enquiries yet. They'll appear here as soon as someone submits the form."}
        </p>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      )}
    </div>
  );
}
