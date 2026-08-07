import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OrdersTab } from "@/actions/admin/orders.actions";

const TABS: { value: OrdersTab; label: string }[] = [
  { value: "awaiting_confirmation", label: "Awaiting Payment Confirmation" },
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrdersTabs({ active }: { active: OrdersTab }) {
  return (
    <div className="flex flex-wrap gap-1 overflow-x-auto border-b border-border pb-2">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={`/admin/orders?tab=${tab.value}`}
          className={cn(
            "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
            active === tab.value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
