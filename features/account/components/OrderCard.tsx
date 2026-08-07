import Link from "next/link";
import { OrderStatusBadge } from "@/features/account/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/features/account/components/PaymentStatusBadge";
import { formatCurrency } from "@/utils/format-currency";

interface OrderCardOrder {
  id: string;
  orderReference: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  createdAt: Date;
  items: { productName: string }[];
}

export function OrderCard({ order }: { order: OrderCardOrder }) {
  const itemsLabel =
    order.items.length === 1
      ? order.items[0].productName
      : `${order.items[0]?.productName ?? ""} + ${order.items.length - 1} more`;

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:border-primary sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{order.orderReference}</span>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <p className="text-sm text-muted-foreground">{itemsLabel}</p>
        <p className="text-xs text-muted-foreground">
          {order.createdAt.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })}
        </p>
      </div>
      <span className="font-medium text-foreground">{formatCurrency(order.totalAmount)}</span>
    </Link>
  );
}
