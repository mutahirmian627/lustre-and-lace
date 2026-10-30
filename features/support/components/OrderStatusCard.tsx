import { CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatusLookupResult } from "@/features/support/types";

const TONE_STYLES = {
  good: { icon: CheckCircle2, className: "text-success" },
  attention: { icon: Clock, className: "text-amber-600 dark:text-amber-400" },
  neutral: { icon: Package, className: "text-primary" },
  bad: { icon: XCircle, className: "text-destructive" },
} as const;

const placedFormat = new Intl.DateTimeFormat("en-PK", { day: "numeric", month: "short", year: "numeric" });

/** Deliberately shows only status and date — see lookupOrderStatus for why nothing more is exposed without a login. */
export function OrderStatusCard({ result }: { result: Extract<OrderStatusLookupResult, { ok: true }> }) {
  const { icon: Icon, className } = TONE_STYLES[result.tone];

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">
        Order <span className="font-medium text-foreground">{result.reference}</span> · placed{" "}
        {placedFormat.format(new Date(result.placedAt))}
      </p>
      <p className={cn("flex items-center gap-1.5 font-medium", className)}>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {result.headline}
      </p>
      <p>{result.detail}</p>
    </div>
  );
}
