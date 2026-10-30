"use server";

import { headers } from "next/headers";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, supportConversations, supportMessages } from "@/db/schema";
import { getSession } from "@/lib/session";
import { allowRequest } from "@/lib/rate-limit";
import { describeOrderStatus, extractOrderReference } from "@/features/support/order-status";
import { supportMessageSchema, type OrderStatusLookupResult, type SupportMessageDTO } from "@/features/support/types";

const MAX_MESSAGES_PER_MINUTE = 10;

/**
 * A customer writes to the support team. Requires an account — that's the
 * whole point of live support, the admin needs to know who is asking — so
 * this is checked here rather than trusting the widget to hide the input.
 */
export async function sendSupportMessage(
  body: string
): Promise<{ error: string } | { success: true; message: SupportMessageDTO }> {
  const session = await getSession();
  if (!session?.user) return { error: "Please sign in to chat with our team." };

  const parsed = supportMessageSchema.safeParse({ body });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid message." };
  const text = parsed.data.body;
  const userId = session.user.id;

  let conversation = await db.query.supportConversations.findFirst({
    where: eq(supportConversations.userId, userId),
    columns: { id: true },
  });
  if (!conversation) {
    // The unique index on userId makes a double-submit race harmless: the loser inserts nothing and re-reads.
    await db.insert(supportConversations).values({ userId }).onConflictDoNothing();
    conversation = await db.query.supportConversations.findFirst({
      where: eq(supportConversations.userId, userId),
      columns: { id: true },
    });
  }
  if (!conversation) return { error: "Couldn't start the conversation. Please try again." };

  const [{ recent }] = await db
    .select({ recent: sql<number>`count(*)::int` })
    .from(supportMessages)
    .where(
      and(
        eq(supportMessages.conversationId, conversation.id),
        eq(supportMessages.senderRole, "user"),
        gte(supportMessages.createdAt, new Date(Date.now() - 60_000))
      )
    );
  if (recent >= MAX_MESSAGES_PER_MINUTE) {
    return { error: "You're sending messages too quickly. Please wait a moment." };
  }

  const now = new Date();
  const message: SupportMessageDTO = {
    id: crypto.randomUUID(),
    senderRole: "user",
    body: text,
    createdAt: now.toISOString(),
  };

  await db.batch([
    db.insert(supportMessages).values({
      id: message.id,
      conversationId: conversation.id,
      senderRole: "user",
      body: text,
      createdAt: now,
    }),
    db
      .update(supportConversations)
      .set({
        status: "open",
        adminUnreadCount: sql`${supportConversations.adminUnreadCount} + 1`,
        lastMessagePreview: text.slice(0, 120),
        lastMessageAt: now,
        updatedAt: now,
      })
      .where(eq(supportConversations.id, conversation.id)),
  ]);

  return { success: true as const, message };
}

const ORDER_LOOKUPS_PER_WINDOW = 10;
const ORDER_LOOKUP_WINDOW_MS = 10 * 60_000;

/**
 * Public on purpose — the chat bot answers "where's my order?" without a
 * login. Because order numbers are sequential, the answer is deliberately
 * limited to status wording and the order date (no names, items, address or
 * totals), a not-found looks the same whatever the reason, and lookups are
 * rate-limited per visitor so the numbers can't be walked through.
 */
export async function lookupOrderStatus(input: string): Promise<OrderStatusLookupResult> {
  const reference = extractOrderReference(input);
  if (!reference) {
    return { ok: false, reason: "invalid", message: "That doesn't look like an order number. It looks like LL-2026-00013." };
  }

  const requestHeaders = await headers();
  const visitor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  if (!allowRequest(`order-lookup:${visitor}`, ORDER_LOOKUPS_PER_WINDOW, ORDER_LOOKUP_WINDOW_MS)) {
    return { ok: false, reason: "rate_limited", message: "That's a lot of lookups in a short time. Please try again in a few minutes." };
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.orderReference, reference),
    columns: { orderReference: true, status: true, paymentStatus: true, paymentMethod: true, createdAt: true },
  });
  if (!order) {
    return {
      ok: false,
      reason: "not_found",
      message: `I couldn't find an order ${reference}. Please check the number in your confirmation email and try again.`,
    };
  }

  return {
    ok: true,
    reference: order.orderReference,
    placedAt: order.createdAt.toISOString(),
    ...describeOrderStatus(order),
  };
}

/** The customer has seen the team's replies (they opened the chat), so clear their unread badge. */
export async function markSupportRead(): Promise<void> {
  const session = await getSession();
  if (!session?.user) return;

  await db
    .update(supportConversations)
    .set({ userUnreadCount: 0 })
    .where(eq(supportConversations.userId, session.user.id));
}
