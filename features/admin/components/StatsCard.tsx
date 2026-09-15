import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  subtext,
  icon: Icon,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  href?: string;
  tone?: "default" | "warning" | "destructive";
}) {
  const content = (
    <div className="flex h-full min-h-28 items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-tight text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 truncate font-heading text-2xl tabular-nums",
            tone === "warning" && "text-amber-600 dark:text-amber-400",
            tone === "destructive" && "text-destructive",
            tone === "default" && "text-foreground"
          )}
        >
          {value}
        </p>
        {/* Always rendered so cards with and without a subtext stay the same height. */}
        <p className="mt-1 min-h-4 truncate text-xs text-muted-foreground">{subtext ?? " "}</p>
      </div>
      <Icon className="size-6 shrink-0 text-muted-foreground" />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}
