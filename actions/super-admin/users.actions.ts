"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { user, session as sessionTable, roleAuditLog } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isSuperAdminRole, type Role } from "@/lib/roles";

const PAGE_SIZE = 20;

/**
 * Role changes are the most sensitive thing in the app, so this checks the
 * role against the database rather than trusting the 5-minute session cookie
 * cache the other admin checks use.
 */
export async function requireSuperAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Super admin access required.");
  const row = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { id: true, email: true, role: true },
  });
  if (!row || !isSuperAdminRole(row.role)) throw new Error("Super admin access required.");
  return row;
}

export interface SuperAdminOverview {
  customers: number;
  admins: number;
  verifiedCustomers: number;
  unverifiedCustomers: number;
  newCustomers7d: number;
  newCustomers30d: number;
  recentSignups: { id: string; name: string; email: string; emailVerified: boolean; createdAt: string }[];
}

export async function getSuperAdminOverview(): Promise<SuperAdminOverview> {
  await requireSuperAdmin();

  const [counts, recent] = await Promise.all([
    db.execute<{
      customers: number;
      admins: number;
      verified: number;
      unverified: number;
      new7: number;
      new30: number;
    }>(sql`
      select
        count(*) filter (where role = 'customer')::int as customers,
        count(*) filter (where role = 'admin')::int as admins,
        count(*) filter (where role = 'customer' and email_verified)::int as verified,
        count(*) filter (where role = 'customer' and not email_verified)::int as unverified,
        count(*) filter (where role = 'customer' and created_at > now() - interval '7 days')::int as new7,
        count(*) filter (where role = 'customer' and created_at > now() - interval '30 days')::int as new30
      from "user"
    `),
    db.execute<SuperAdminOverview["recentSignups"][number] & { [key: string]: unknown }>(sql`
      select id, name, email, email_verified as "emailVerified", created_at as "createdAt"
      from "user" where role = 'customer' order by created_at desc limit 6
    `),
  ]);

  const c = counts.rows[0];
  return {
    customers: c.customers,
    admins: c.admins,
    verifiedCustomers: c.verified,
    unverifiedCustomers: c.unverified,
    newCustomers7d: c.new7,
    newCustomers30d: c.new30,
    recentSignups: recent.rows,
  };
}

export interface ManagedUserRow {
  [key: string]: unknown;
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  totalOrders: number;
}

/** Customers (paged, searchable) or admins (a short list, so no paging). */
export async function listManagedUsers({
  role,
  search,
  page = 1,
}: {
  role: "customer" | "admin";
  search?: string;
  page?: number;
}) {
  await requireSuperAdmin();
  const offset = (page - 1) * PAGE_SIZE;
  const like = search ? `%${search}%` : null;
  const searchClause = like ? sql`and (u.name ilike ${like} or u.email ilike ${like})` : sql``;

  const [rows, total] = await Promise.all([
    db.execute<ManagedUserRow>(sql`
      select
        u.id, u.name, u.email, u.phone, u.role, u.email_verified as "emailVerified",
        u.created_at as "createdAt",
        (select max(s.updated_at) from session s where s.user_id = u.id) as "lastActiveAt",
        (select count(*) from orders o where o.user_id = u.id)::int as "totalOrders"
      from "user" u
      where u.role = ${role} ${searchClause}
      order by u.created_at desc
      limit ${PAGE_SIZE} offset ${offset}
    `),
    db.execute<{ count: number }>(sql`
      select count(*)::int as count from "user" u where u.role = ${role} ${searchClause}
    `),
  ]);

  const count = total.rows[0].count;
  return { users: rows.rows, totalCount: count, totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)) };
}

export interface AuditRow {
  [key: string]: unknown;
  id: string;
  targetEmail: string;
  actorEmail: string;
  fromRole: Role;
  toRole: Role;
  createdAt: string;
}

export async function getRoleAuditLog({ page = 1 }: { page?: number } = {}) {
  await requireSuperAdmin();
  const offset = (page - 1) * PAGE_SIZE;
  const [rows, total] = await Promise.all([
    db.execute<AuditRow>(sql`
      select id, target_email as "targetEmail", actor_email as "actorEmail",
        from_role as "fromRole", to_role as "toRole", created_at as "createdAt"
      from role_audit_log order by created_at desc limit ${PAGE_SIZE} offset ${offset}
    `),
    db.execute<{ count: number }>(sql`select count(*)::int as count from role_audit_log`),
  ]);
  const count = total.rows[0].count;
  return { entries: rows.rows, totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)) };
}

type ActionResult = { error: string } | { success: true };

async function changeRole(userId: string, from: "customer" | "admin", to: "customer" | "admin"): Promise<ActionResult> {
  const actor = await requireSuperAdmin();

  const target = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, email: true, role: true, emailVerified: true },
  });
  if (!target) return { error: "That account no longer exists." };
  if (target.role === "super_admin") return { error: "The super admin account can't be changed." };
  if (target.role !== from) {
    return { error: from === "customer" ? "That account is already an admin." : "That account isn't an admin." };
  }
  if (to === "admin" && !target.emailVerified) {
    return { error: "Only accounts with a verified email can be promoted." };
  }

  // The role is part of the WHERE so two clicks (or two tabs) can't double-apply.
  const updated = await db
    .update(user)
    .set({ role: to, updatedAt: new Date() })
    .where(and(eq(user.id, userId), eq(user.role, from)))
    .returning({ id: user.id });
  if (updated.length === 0) return { error: "That account changed while you were working. Refresh and try again." };

  await db.insert(roleAuditLog).values({
    targetUserId: target.id,
    targetEmail: target.email,
    actorUserId: actor.id,
    actorEmail: actor.email,
    fromRole: from,
    toRole: to,
  });
  // Sign a demoted admin out everywhere so they stop being treated as staff as soon as their
  // cached session cookie expires.
  if (to === "customer") await db.delete(sessionTable).where(eq(sessionTable.userId, userId));

  revalidatePath("/super-admin", "layout");
  return { success: true as const };
}

export async function promoteToAdmin(userId: string) {
  return changeRole(userId, "customer", "admin");
}

export async function demoteAdmin(userId: string) {
  return changeRole(userId, "admin", "customer");
}

/** Signs an account out of every device (e.g. a lost laptop or a suspicious login). */
export async function revokeUserSessions(userId: string): Promise<ActionResult> {
  await requireSuperAdmin();
  const target = await db.query.user.findFirst({ where: eq(user.id, userId), columns: { id: true, role: true } });
  if (!target) return { error: "That account no longer exists." };
  if (target.role === "super_admin") return { error: "Sign out of the super admin account from the menu instead." };
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
  revalidatePath("/super-admin", "layout");
  return { success: true as const };
}
