"use server";

import { headers } from "next/headers";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user, orders, addresses } from "@/db/schema";
import { auth } from "@/lib/auth";

const PAGE_SIZE = 20;

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return session.user;
}

export interface AdminCustomerRow {
  [key: string]: unknown;
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "customer" | "admin";
  emailVerified: boolean;
  // db.execute() bypasses drizzle's relational-query type mapping and
  // returns the raw driver value — timestamps come back as strings here,
  // not Date instances (verified against the real Neon driver).
  createdAt: string;
  totalOrders: number;
  totalSpent: string;
}

/**
 * Raw SQL join+aggregate rather than an N+1 per-row lookup — "total spent"
 * uses the same "money actually collected" definition as the dashboard's
 * Confirmed Revenue (specs/13): paid orders, plus delivered COD orders.
 */
export async function getAdminCustomers({ search, page = 1 }: { search?: string; page?: number }) {
  const offset = (page - 1) * PAGE_SIZE;
  const searchClause = search
    ? sql`where (${ilike(user.name, `%${search}%`)} or ${ilike(user.email, `%${search}%`)})`
    : sql``;

  const rows = await db.execute<AdminCustomerRow>(sql`
    select
      u.id, u.name, u.email, u.phone, u.role, u.email_verified as "emailVerified", u.created_at as "createdAt",
      coalesce(o.total_orders, 0)::int as "totalOrders",
      coalesce(o.total_spent, 0)::text as "totalSpent"
    from "user" u
    left join (
      select
        user_id,
        count(*) as total_orders,
        sum(case when payment_status = 'paid' or (payment_method = 'cod' and status = 'delivered') then total_amount else 0 end) as total_spent
      from orders
      where user_id is not null
      group by user_id
    ) o on o.user_id = u.id
    ${searchClause}
    order by u.created_at desc
    limit ${PAGE_SIZE} offset ${offset}
  `);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(search ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`)) : undefined);

  return { customers: rows.rows, totalPages: Math.ceil(count / PAGE_SIZE), totalCount: count };
}

export async function getCustomerDetail(userId: string) {
  const [customerRow, customerOrders, customerAddresses] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, userId) }),
    db.query.orders.findMany({
      where: eq(orders.userId, userId),
      orderBy: [desc(orders.createdAt)],
      with: { items: { columns: { id: true, productName: true } } },
    }),
    db.query.addresses.findMany({ where: eq(addresses.userId, userId) }),
  ]);

  if (!customerRow) return null;
  return { user: customerRow, orders: customerOrders, addresses: customerAddresses };
}

/** The intended path for admin #2, #3, etc. — public sign-up can never self-assign admin (specs/03), this action is how every subsequent admin is created. */
export async function promoteToAdmin(userId: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  await db.update(user).set({ role: "admin", updatedAt: new Date() }).where(eq(user.id, userId));
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  return { success: true as const };
}

export async function demoteToCustomer(userId: string): Promise<{ error: string } | { success: true }> {
  const currentAdmin = await requireAdmin();
  if (currentAdmin.id === userId) {
    return { error: "You can't demote your own account." };
  }
  await db.update(user).set({ role: "customer", updatedAt: new Date() }).where(eq(user.id, userId));
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  return { success: true as const };
}
