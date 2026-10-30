import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Inbox", href: "/admin/support" },
  { label: "Quick Answers", href: "/admin/support/faqs" },
] as const;

export function SupportSubnav({ active }: { active: (typeof TABS)[number]["href"] }) {
  return (
    <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Support sections">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          role="tab"
          aria-selected={tab.href === active}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            tab.href === active
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
