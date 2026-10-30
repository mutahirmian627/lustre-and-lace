"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { requireAdminUser } from "@/lib/require-admin";
import { FAQS_CACHE_TAG } from "@/lib/support-queries";
import { faqFormSchema, type FaqFormInput } from "@/features/support/types";

export async function getAdminFaqs() {
  await requireAdminUser();
  return db.query.faqs.findMany({ orderBy: [asc(faqs.displayOrder), asc(faqs.createdAt)] });
}

function refresh() {
  // The widget reads a cached copy; without this, edits would take up to an hour to show.
  revalidateTag(FAQS_CACHE_TAG);
  revalidatePath("/admin/support/faqs");
}

export async function createFaq(input: FaqFormInput): Promise<{ error: string } | { success: true }> {
  await requireAdminUser();
  const parsed = faqFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };

  await db.insert(faqs).values({
    question: parsed.data.question,
    answer: parsed.data.answer,
    displayOrder: parsed.data.displayOrder,
    isActive: parsed.data.isActive ?? true,
  });
  refresh();
  return { success: true as const };
}

export async function updateFaq(id: string, input: FaqFormInput): Promise<{ error: string } | { success: true }> {
  await requireAdminUser();
  const parsed = faqFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };

  await db
    .update(faqs)
    .set({
      question: parsed.data.question,
      answer: parsed.data.answer,
      displayOrder: parsed.data.displayOrder,
      isActive: parsed.data.isActive ?? true,
      updatedAt: new Date(),
    })
    .where(eq(faqs.id, id));
  refresh();
  return { success: true as const };
}

export async function deleteFaq(id: string): Promise<{ error: string } | { success: true }> {
  await requireAdminUser();
  await db.delete(faqs).where(eq(faqs.id, id));
  refresh();
  return { success: true as const };
}

export async function toggleFaqActive(id: string, isActive: boolean): Promise<{ error: string } | { success: true }> {
  await requireAdminUser();
  await db.update(faqs).set({ isActive, updatedAt: new Date() }).where(eq(faqs.id, id));
  refresh();
  return { success: true as const };
}
