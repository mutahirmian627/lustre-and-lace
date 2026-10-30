"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { supportConversations, supportMessages } from "@/db/schema";
import { requireAdminUser } from "@/lib/require-admin";
import { supportMessageSchema, type SupportMessageDTO } from "@/features/support/types";

export async function sendAdminReply(
  conversationId: string,
  body: string
): Promise<{ error: string } | { success: true; message: SupportMessageDTO }> {
  const admin = await requireAdminUser();

  const parsed = supportMessageSchema.safeParse({ body });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid message." };
  const text = parsed.data.body;

  const conversation = await db.query.supportConversations.findFirst({
    where: eq(supportConversations.id, conversationId),
    columns: { id: true },
  });
  if (!conversation) return { error: "That conversation no longer exists." };

  const now = new Date();
  const message: SupportMessageDTO = {
    id: crypto.randomUUID(),
    senderRole: "admin",
    body: text,
    createdAt: now.toISOString(),
  };

  await db.batch([
    db.insert(supportMessages).values({
      id: message.id,
      conversationId,
      senderRole: "admin",
      senderId: admin.id,
      body: text,
      createdAt: now,
    }),
    db
      .update(supportConversations)
      .set({
        // Replying means the admin has read everything up to now.
        adminUnreadCount: 0,
        userUnreadCount: sql`${supportConversations.userUnreadCount} + 1`,
        lastMessagePreview: text.slice(0, 120),
        lastMessageAt: now,
        updatedAt: now,
      })
      .where(eq(supportConversations.id, conversationId)),
  ]);

  return { success: true as const, message };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await requireAdminUser();
  await db
    .update(supportConversations)
    .set({ adminUnreadCount: 0 })
    .where(eq(supportConversations.id, conversationId));
}

export async function setConversationStatus(
  conversationId: string,
  status: "open" | "closed"
): Promise<{ error: string } | { success: true }> {
  await requireAdminUser();
  await db
    .update(supportConversations)
    .set({ status, updatedAt: new Date() })
    .where(eq(supportConversations.id, conversationId));
  return { success: true as const };
}
