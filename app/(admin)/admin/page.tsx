import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart, Wallet, Clock, UserPlus, AlertTriangle } from "lucide-react";
import {
  getDashboardStats,
  getOrdersLast30Days,
  getTopSellingProducts,
  getOrderStatusBreakdown,
  getRecentOrders,
} from "@/actions/admin/dashboard.actions";
import { StatsCard } from "@/features/admin/components/StatsCard";
import { DataTable } from "@/features/admin/components/DataTable";
import {
  OrdersOverTimeChart,
  TopProductsChart,
  OrderStatusDonutChart,
} from "@/features/admin/components/DashboardCharts";
import { OrderStatusBadge } from "@/features/account/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/features/account/components/PaymentStatusBadge";
import { formatCurrency } from "@/utils/format-currency";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, ordersLast30Days, topProducts, statusBreakdown, recentOrders] = await Promise.all([
    getDashboardStats(),
    getOrdersLast30Days(),
    getTopSellingProducts(),
    getOrderStatusBreakdown(),
    getRecentOrders(),
  ]);

  return (
    <div className="space-y-8">
      <h2 className="font-heading text-2xl text-foreground">Dashboard</h2>

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          label="Total Orders"
          value={stats.totalOrders}
          subtext={`${stats.ordersThisMonth} this month`}
          icon={ShoppingCart}
        />
        <StatsCard
          label="Confirmed Revenue"
          value={formatCurrency(stats.confirmedRevenue)}
          icon={Wallet}
        />
        <StatsCard
          label="Awaiting Payment"
          value={stats.awaitingPaymentCount}
          icon={Clock}
          href="/admin/orders?tab=awaiting_confirmation"
          tone={stats.awaitingPaymentCount > 0 ? "warning" : "default"}
        />
        <StatsCard
          label="New Customers"
          value={stats.newCustomersThisMonth}
          subtext="this month"
          icon={UserPlus}
        />
        <StatsCard
          label="Low Stock Alerts"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          href="/admin/inventory?filter=low_stock"
          tone={stats.lowStockCount > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border p-4 lg:col-span-2">
          <h3 className="mb-2 font-heading text-lg text-foreground">Orders — Last 30 Days</h3>
          <OrdersOverTimeChart data={ordersLast30Days} />
        </div>
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-2 font-heading text-lg text-foreground">Order Status</h3>
          <OrderStatusDonutChart data={statusBreakdown} />
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-2 font-heading text-lg text-foreground">Top Selling Products</h3>
        <TopProductsChart data={topProducts} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg text-foreground">Recent Orders</h3>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <DataTable
          rows={recentOrders}
          rowKey={(o) => o.id}
          emptyMessage="No orders yet."
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
              cell: (o) =>
                o.createdAt.toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
            },
            { header: "Items", cell: (o) => o.items.length },
            { header: "Total", cell: (o) => formatCurrency(o.totalAmount) },
            { header: "Status", cell: (o) => <OrderStatusBadge status={o.status} /> },
            { header: "Payment", cell: (o) => <PaymentStatusBadge status={o.paymentStatus} /> },
          ]}
        />
      </div>
    </div>
  );
}
