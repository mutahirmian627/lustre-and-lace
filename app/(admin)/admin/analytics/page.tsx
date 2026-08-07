import type { Metadata } from "next";
import { getAnalytics, exportAnalyticsCsv } from "@/actions/admin/analytics.actions";
import { DateRangePicker } from "@/features/admin/components/DateRangePicker";
import { ExportCsvButton } from "@/features/admin/components/ExportCsvButton";
import {
  RevenueOverTimeChart,
  TopProductsRankingChart,
  CategoryPerformanceChart,
} from "@/features/admin/components/AnalyticsCharts";
import { StatsCard } from "@/features/admin/components/StatsCard";
import { Wallet, TrendingUp, UserPlus, Users } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";

export const metadata: Metadata = { title: "Admin — Analytics" };

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const from = params.from ?? toDateInputValue(thirtyDaysAgo);
  const to = params.to ?? toDateInputValue(today);

  const analytics = await getAnalytics({ from, to });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-2xl text-foreground">Analytics</h2>
        <ExportCsvButton filename={`analytics-${from}-to-${to}.csv`} arg={{ from, to }} fetchCsv={exportAnalyticsCsv} />
      </div>

      <DateRangePicker from={from} to={to} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Revenue in Range" value={formatCurrency(analytics.totalRevenue)} icon={Wallet} />
        <StatsCard label="Products Sold" value={analytics.topProducts.reduce((sum, p) => sum + p.quantity, 0)} icon={TrendingUp} />
        <StatsCard label="New Customers" value={analytics.newCustomers} icon={UserPlus} />
        <StatsCard label="Returning Customers" value={analytics.returningCustomers} icon={Users} />
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-2 font-heading text-lg text-foreground">Revenue Over Time</h3>
        <RevenueOverTimeChart data={analytics.revenueByDay} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-2 font-heading text-lg text-foreground">Best Selling Products</h3>
          {analytics.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales in this range.</p>
          ) : (
            <TopProductsRankingChart data={analytics.topProducts} />
          )}
        </div>
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-2 font-heading text-lg text-foreground">Category Performance</h3>
          {analytics.categoryPerformance.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No sales in this range.</p>
          ) : (
            <CategoryPerformanceChart data={analytics.categoryPerformance} />
          )}
        </div>
      </div>
    </div>
  );
}
