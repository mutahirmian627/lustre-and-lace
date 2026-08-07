import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  cod_pending: "Pay on Delivery",
  awaiting_confirmation: "Awaiting Payment",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

/** Always outlined — the visual opposite of OrderStatusBadge's solid fill (specs/11). */
const STATUS_CLASSNAME: Record<string, string> = {
  cod_pending: "border-border text-muted-foreground",
  awaiting_confirmation: "border-amber-500 text-amber-600 dark:text-amber-400",
  paid: "border-success text-success",
  failed: "border-destructive text-destructive",
  refunded: "border-border text-muted-foreground",
};

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSNAME[status])}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
