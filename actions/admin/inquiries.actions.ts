"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { projectInquiries } from "@/db/schema";
import { requireAdminUser } from "@/lib/require-admin";
import { INQUIRY_STATUSES, type InquiryStatus } from "@/constants/inquiry-status";

const statusSchema = z.enum(INQUIRY_STATUSES);

export async function getInquiries(status?: InquiryStatus) {
  await requireAdminUser();
  return db.query.projectInquiries.findMany({
    where: status ? eq(projectInquiries.status, status) : undefined,
    orderBy: [desc(projectInquiries.createdAt)],
    limit: 200,
  });
}

/** Per-status totals for the filter tabs and the sidebar badge. */
export async function getInquiryCounts(): Promise<Record<InquiryStatus | "all", number>> {
  await requireAdminUser();
  const rows = await db
    .select({ status: projectInquiries.status, count: sql<number>`count(*)::int` })
    .from(projectInquiries)
    .groupBy(projectInquiries.status);

  const counts: Record<InquiryStatus | "all", number> = { all: 0, new: 0, in_progress: 0, won: 0, closed: 0 };
  for (const row of rows) {
    counts[row.status] = row.count;
    counts.all += row.count;
  }
  return counts;
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  await requireAdminUser();
  const parsed = statusSchema.parse(status);
  await db
    .update(projectInquiries)
    .set({ status: parsed, updatedAt: new Date() })
    .where(eq(projectInquiries.id, id));
  revalidatePath("/admin/inquiries");
}

export async function saveInquiryNotes(id: string, notes: string) {
  await requireAdminUser();
  const trimmed = notes.trim().slice(0, 5000);
  await db
    .update(projectInquiries)
    .set({ adminNotes: trimmed || null, updatedAt: new Date() })
    .where(eq(projectInquiries.id, id));
  revalidatePath("/admin/inquiries");
}
