"use server";

import { headers } from "next/headers";
import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { auth } from "@/lib/auth";
import { applyCancellationSideEffects } from "@/lib/order-cancellation";
import { toCsv } from "@/utils/csv";
import { formatCurrency } from "@/utils/format-currency";

const PAGE_SIZE = 20;
const FORWARD_STATUSES = ["pending", "processing", "shipped", "delivered"] as const;

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

export type OrdersTab =
  | "all"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "awaiting_confirmation";

function whereForTab(tab: OrdersTab) {
  if (tab === "all") return undefined;
  if (tab === "awaiting_confirmation") return eq(orders.paymentStatus, "awaiting_confirmation");
  return eq(orders.status, tab);
}

export async function getAdminOrders({ tab = "all", page = 1 }: { tab?: OrdersTab; page?: number }) {
  const where = whereForTab(tab);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, [{ count }]] = await Promise.all([
    db.query.orders.findMany({
      where,
      orderBy: [desc(orders.createdAt)],
      limit: PAGE_SIZE,
      offset,
      with: { items: { columns: { id: true } } },
    }),
    db.select({ count: sql<number>`count(*)::int` }).from(orders).where(where),
  ]);

  return { orders: rows, totalPages: Math.ceil(count / PAGE_SIZE), totalCount: count };
}

export async function getAwaitingPaymentCount() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.paymentStatus, "awaiting_confirmation"));
  return count;
}

export async function getAdminOrderById(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: { with: { product: { columns: { slug: true } } } }, user: { columns: { name: true, email: true } } },
  });
}

export async function confirmPayment(orderId: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return { error: "Order not found." };
  if (order.paymentStatus !== "awaiting_confirmation") {
    return { error: "This order isn't awaiting payment confirmation." };
  }

  await db.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true as const };
}

/** Kept deliberately separate from "mark delivered" — a COD delivery attempt can fail, so the two must not be conflated (specs/13). */
export async function markCodPaymentReceived(orderId: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return { error: "Order not found." };
  if (order.paymentMethod !== "cod" || order.paymentStatus !== "cod_pending") {
    return { error: "This order isn't a pending COD payment." };
  }

  await db.update(orders).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true as const };
}

export async function advanceOrderStatus(orderId: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return { error: "Order not found." };

  const currentIndex = FORWARD_STATUSES.indexOf(order.status as (typeof FORWARD_STATUSES)[number]);
  if (currentIndex === -1 || currentIndex === FORWARD_STATUSES.length - 1) {
    return { error: "This order has no further forward status to advance to." };
  }

  const nextStatus = FORWARD_STATUSES[currentIndex + 1];
  await db.update(orders).set({ status: nextStatus, updatedAt: new Date() }).where(eq(orders.id, orderId));
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true as const };
}

/** Same restriction as customer self-cancellation, minus the pending-only rule — admins may also cancel from processing (specs/13). */
export async function cancelOrderAdmin(orderId: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
  if (!order) return { error: "Order not found." };
  if (order.status !== "pending" && order.status !== "processing") {
    return { error: "Only pending or processing orders can be cancelled." };
  }

  await applyCancellationSideEffects(order);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true as const };
}

/**
 * No courier/tracking-number field exists — there's no shipping-carrier
 * API integration in this project, so a courier reference just goes in
 * this free-text field instead of a new schema column (specs/13).
 */
export async function updateAdminNotes(orderId: string, notes: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  await db.update(orders).set({ adminNotes: notes || null, updatedAt: new Date() }).where(eq(orders.id, orderId));
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true as const };
}

export async function exportOrdersCsv(tab: OrdersTab = "all"): Promise<string> {
  await requireAdmin();
  const where = whereForTab(tab);
  const rows = await db.query.orders.findMany({ where, orderBy: [desc(orders.createdAt)] });

  return toCsv(
    ["Order Reference", "Date", "Customer", "Email", "Payment Method", "Payment Status", "Order Status", "Total"],
    rows.map((o) => [
      o.orderReference,
      o.createdAt.toISOString().slice(0, 10),
      o.customerName,
      o.customerEmail,
      o.paymentMethod,
      o.paymentStatus,
      o.status,
      formatCurrency(o.totalAmount),
    ])
  );
}
