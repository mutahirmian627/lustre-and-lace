import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
  /** Alternative to actionLabel/actionHref for CTAs that aren't a plain navigation link (e.g. a dialog trigger). */
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h3 className="font-heading text-xl text-foreground">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={cn(buttonVariants(), "mt-2")}>
          {actionLabel}
        </Link>
      )}
      {children}
    </div>
  );
}
