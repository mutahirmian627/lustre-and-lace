import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FORWARD_STEPS = ["pending", "processing", "shipped", "delivered"] as const;
const STEP_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

/**
 * Cancelled is a distinct end-state, not squeezed into the forward
 * pending->processing->shipped->delivered timeline (specs/11).
 */
export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        <X className="size-4" />
        Order Cancelled
      </div>
    );
  }

  const currentIndex = FORWARD_STEPS.indexOf(status as (typeof FORWARD_STEPS)[number]);

  return (
    <div className="flex items-center">
      {FORWARD_STEPS.map((step, index) => {
        const isComplete = index <= currentIndex;
        const isLast = index === FORWARD_STEPS.length - 1;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs",
                  isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="size-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isComplete ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {STEP_LABEL[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1",
                  index < currentIndex ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
