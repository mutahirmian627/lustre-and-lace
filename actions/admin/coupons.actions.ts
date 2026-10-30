"use server";

import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { auth } from "@/lib/auth";
import { couponFormSchema, type CouponFormInput } from "@/features/admin/types";
import { isAdminRole } from "@/lib/roles";
import { requireAdminUser } from "@/lib/require-admin";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !isAdminRole(session.user.role)) {
    throw new Error("Admin access required.");
  }
}

export async function getAdminCoupons() {
  await requireAdminUser();
  return db.query.coupons.findMany({ orderBy: [desc(coupons.createdAt)] });
}

function toValues(data: CouponFormInput) {
  return {
    code: data.code.trim().toUpperCase(),
    type: data.type,
    value: data.value.toFixed(2),
    minOrderAmount: data.minOrderAmount ? Number(data.minOrderAmount).toFixed(2) : null,
    maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount).toFixed(2) : null,
    usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive ?? true,
  };
}

export async function createCoupon(input: CouponFormInput): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const parsed = couponFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };

  const existing = await db.query.coupons.findFirst({ where: eq(coupons.code, parsed.data.code.trim().toUpperCase()) });
  if (existing) return { error: "A coupon with this code already exists." };

  await db.insert(coupons).values(toValues(parsed.data));
  revalidatePath("/admin/coupons");
  return { success: true as const };
}

export async function updateCoupon(id: string, input: CouponFormInput): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const parsed = couponFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };

  const existing = await db.query.coupons.findFirst({ where: eq(coupons.code, parsed.data.code.trim().toUpperCase()) });
  if (existing && existing.id !== id) return { error: "A coupon with this code already exists." };

  await db.update(coupons).set({ ...toValues(parsed.data), updatedAt: new Date() }).where(eq(coupons.id, id));
  revalidatePath("/admin/coupons");
  return { success: true as const };
}

export async function deleteCoupon(id: string): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  await db.delete(coupons).where(eq(coupons.id, id));
  revalidatePath("/admin/coupons");
  return { success: true as const };
}

export async function toggleCouponActive(id: string, isActive: boolean): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  await db.update(coupons).set({ isActive, updatedAt: new Date() }).where(eq(coupons.id, id));
  revalidatePath("/admin/coupons");
  return { success: true as const };
}
