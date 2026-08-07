import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * Solid soft-fill badges for fulfillment status — deliberately styled
 * differently from PaymentStatusBadge's outlined look so the two never get
 * visually confused on the same order row (specs/11).
 */
const STATUS_CLASSNAME: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-accent text-accent-foreground",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_CLASSNAME[status])}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
