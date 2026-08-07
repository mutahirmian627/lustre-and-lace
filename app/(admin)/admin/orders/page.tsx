import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOrders, exportOrdersCsv, type OrdersTab } from "@/actions/admin/orders.actions";
import { OrdersTabs } from "@/features/admin/components/OrdersTabs";
import { DataTable } from "@/features/admin/components/DataTable";
import { ExportCsvButton } from "@/features/admin/components/ExportCsvButton";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";
import { OrderStatusBadge } from "@/features/account/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/features/account/components/PaymentStatusBadge";
import { formatCurrency } from "@/utils/format-currency";

export const metadata: Metadata = { title: "Admin — Orders" };

const VALID_TABS: OrdersTab[] = [
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "awaiting_confirmation",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const params = await searchParams;
  // Awaiting Payment Confirmation is the default landing tab — it's the
  // one requiring active admin attention day to day (specs/13).
  const tab = (VALID_TABS.includes(params.tab as OrdersTab) ? params.tab : "awaiting_confirmation") as OrdersTab;
  const page = Math.max(1, Number(params.page) || 1);

  const { orders, totalPages } = await getAdminOrders({ tab, page });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-foreground">Orders</h2>
        <ExportCsvButton filename={`orders-${tab}.csv`} arg={tab} fetchCsv={exportOrdersCsv} />
      </div>

      <OrdersTabs active={tab} />

      <DataTable
        rows={orders}
        rowKey={(o) => o.id}
        emptyMessage="No orders in this view."
        columns={[
          {
            header: "Reference",
            cell: (o) => (
              <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline">
                {o.orderReference}
              </Link>
            ),
          },
          { header: "Customer", cell: (o) => o.customerName },
          {
            header: "Date",
            cell: (o) => o.createdAt.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
          },
          { header: "Items", cell: (o) => o.items.length },
          { header: "Total", cell: (o) => formatCurrency(o.totalAmount) },
          {
            header: "Payment Method",
            cell: (o) => (o.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"),
          },
          { header: "Payment", cell: (o) => <PaymentStatusBadge status={o.paymentStatus} /> },
          { header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
        ]}
      />

      <ProductListPagination basePath="/admin/orders" currentParams={{ tab }} page={page} totalPages={totalPages} />
    </div>
  );
}
