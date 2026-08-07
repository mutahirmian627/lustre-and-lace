import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, productVariants, user } from "@/db/schema";
import { LOW_STOCK_THRESHOLD } from "@/constants/inventory";

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getDashboardStats() {
  const monthStart = startOfMonth();

  const [
    [{ count: totalOrders }],
    [{ count: ordersThisMonth }],
    [{ revenue: confirmedRevenue }],
    [{ count: awaitingPaymentCount }],
    [{ count: newCustomersThisMonth }],
    [{ count: lowStockCount }],
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(orders),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(gte(orders.createdAt, monthStart)),
    // "Confirmed Revenue": money actually collected, not just orders placed —
    // paid orders, plus COD orders that have actually been delivered
    // (specs/13). A delivered-but-not-yet-marked-received COD order still
    // counts, since the cash changes hands at the door regardless of when
    // the admin gets around to clicking "Mark Payment Received".
    db
      .select({ revenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(
        sql`(${orders.paymentStatus} = 'paid') or (${orders.paymentMethod} = 'cod' and ${orders.status} = 'delivered')`
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.paymentStatus, "awaiting_confirmation")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(user)
      .where(and(eq(user.role, "customer"), gte(user.createdAt, monthStart))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(productVariants)
      .where(lte(productVariants.stockQuantity, LOW_STOCK_THRESHOLD)),
  ]);

  return {
    totalOrders,
    ordersThisMonth,
    confirmedRevenue: Number(confirmedRevenue),
    awaitingPaymentCount,
    newCustomersThisMonth,
    lowStockCount,
  };
}

export async function getOrdersLast30Days() {
  const since = daysAgo(29);
  const rows = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(gte(orders.createdAt, since))
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = daysAgo(29 - i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: byDay.get(key) ?? 0 };
  });
  return days;
}

export async function getTopSellingProducts(limit = 5) {
  return db.query.products.findMany({
    orderBy: [desc(products.salesCount)],
    limit,
    columns: { id: true, name: true, salesCount: true },
  });
}

export async function getOrderStatusBreakdown() {
  const rows = await db
    .select({ status: orders.status, count: sql<number>`count(*)::int` })
    .from(orders)
    .groupBy(orders.status);
  return rows;
}

export async function getRecentOrders(limit = 10) {
  return db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit,
    with: { items: { columns: { id: true } } },
  });
}

