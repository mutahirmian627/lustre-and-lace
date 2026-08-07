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
    <div className="flex items-start justify-between rounded-lg border border-border p-4">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "font-heading text-2xl",
            tone === "warning" && "text-amber-600 dark:text-amber-400",
            tone === "destructive" && "text-destructive",
            tone === "default" && "text-foreground"
          )}
        >
          {value}
        </p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
      <Icon className="size-6 text-muted-foreground" />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        {content}
      </Link>
    );
  }
  return content;
}
