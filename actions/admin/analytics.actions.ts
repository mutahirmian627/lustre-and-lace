"use server";

import { headers } from "next/headers";
import { and, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { auth } from "@/lib/auth";
import { toCsv } from "@/utils/csv";
import { formatCurrency } from "@/utils/format-currency";
import { isAdminRole } from "@/lib/roles";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !isAdminRole(session.user.role)) {
    throw new Error("Admin access required.");
  }
}

// Same "money actually collected" definition as the Dashboard's Confirmed Revenue (specs/13).
const CONFIRMED_SQL = sql`(${orders.paymentStatus} = 'paid' or (${orders.paymentMethod} = 'cod' and ${orders.status} = 'delivered'))`;

function dateRange(from: string, to: string) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getAnalytics({ from, to }: { from: string; to: string }) {
  await requireAdmin();
  const { start, end } = dateRange(from, to);
  const inRange = and(gte(orders.createdAt, start), lte(orders.createdAt, end));

  const [revenueByDayResult, topProductsResult, categoryPerformanceResult, customerSplitResult] = await Promise.all([
    db.execute<{ day: string; revenue: string }>(sql`
      select to_char(${orders.createdAt}, 'YYYY-MM-DD') as day, coalesce(sum(${orders.totalAmount}), 0)::text as revenue
      from orders
      where ${inRange} and ${CONFIRMED_SQL}
      group by day
      order by day
    `),
    db.execute<{ name: string; quantity: number; revenue: string }>(sql`
      select oi.product_name as name, sum(oi.quantity)::int as quantity, sum(oi.total_price)::text as revenue
      from order_items oi
      join orders on orders.id = oi.order_id
      where ${inRange} and ${CONFIRMED_SQL}
      group by oi.product_name
      order by quantity desc
      limit 15
    `),
    db.execute<{ category: string; revenue: string }>(sql`
      select c.name as category, sum(oi.total_price)::text as revenue
      from order_items oi
      join orders on orders.id = oi.order_id
      join products p on p.id = oi.product_id
      join categories c on c.id = p.category_id
      where ${inRange} and ${CONFIRMED_SQL}
      group by c.name
      order by revenue desc
    `),
    // A customer counts as "new" if their all-time first order falls inside
    // this range; "returning" if they'd already ordered before it started.
    // Guests (userId null) have no persistent history, so they're excluded
    // from this split entirely rather than being force-fit into either bucket.
    db.execute<{ is_new: boolean; count: number }>(sql`
      select (first_order.first_created_at >= ${start}) as is_new, count(*)::int as count
      from (
        select user_id, min(created_at) as first_created_at
        from orders
        where user_id in (
          select distinct user_id from orders
          where user_id is not null and created_at >= ${start} and created_at <= ${end}
        )
        group by user_id
      ) first_order
      group by is_new
    `),
  ]);

  const totalRevenue = revenueByDayResult.rows.reduce((sum, r) => sum + Number(r.revenue), 0);

  return {
    revenueByDay: revenueByDayResult.rows.map((r) => ({ date: r.day, revenue: Number(r.revenue) })),
    totalRevenue,
    topProducts: topProductsResult.rows.map((r) => ({ name: r.name, quantity: r.quantity, revenue: Number(r.revenue) })),
    categoryPerformance: categoryPerformanceResult.rows.map((r) => ({ category: r.category, revenue: Number(r.revenue) })),
    newCustomers: customerSplitResult.rows.find((r) => r.is_new)?.count ?? 0,
    returningCustomers: customerSplitResult.rows.find((r) => !r.is_new)?.count ?? 0,
  };
}

export async function exportAnalyticsCsv({ from, to }: { from: string; to: string }): Promise<string> {
  await requireAdmin();
  const { start, end } = dateRange(from, to);
  const rows = await db.query.orders.findMany({
    where: and(gte(orders.createdAt, start), lte(orders.createdAt, end)),
    orderBy: (o, { desc }) => [desc(o.createdAt)],
  });

  return toCsv(
    ["Order Reference", "Date", "Customer", "Payment Status", "Order Status", "Total"],
    rows.map((o) => [
      o.orderReference,
      o.createdAt.toISOString().slice(0, 10),
      o.customerName,
      o.paymentStatus,
      o.status,
      formatCurrency(o.totalAmount),
    ])
  );
}
