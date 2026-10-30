import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { faqs, supportConversations, supportMessages, user } from "@/db/schema";
import type {
  AdminConversationSummary,
  AdminThreadDTO,
  FaqDTO,
  SupportMessageDTO,
  UserThreadDTO,
} from "@/features/support/types";

export const FAQS_CACHE_TAG = "faqs";

const THREAD_MESSAGE_LIMIT = 200;

function toMessageDTO(row: typeof supportMessages.$inferSelect): SupportMessageDTO {
  return {
    id: row.id,
    senderRole: row.senderRole,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Last N messages, oldest first, so the UI can render them top-to-bottom as-is. */
async function getRecentMessages(conversationId: string): Promise<SupportMessageDTO[]> {
  const rows = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.conversationId, conversationId))
    .orderBy(desc(supportMessages.createdAt))
    .limit(THREAD_MESSAGE_LIMIT);
  return rows.reverse().map(toMessageDTO);
}

export async function getUserThread(userId: string): Promise<UserThreadDTO> {
  const conversation = await db.query.supportConversations.findFirst({
    where: eq(supportConversations.userId, userId),
  });
  if (!conversation) return { status: "open", userUnreadCount: 0, messages: [] };

  return {
    status: conversation.status,
    userUnreadCount: conversation.userUnreadCount,
    messages: await getRecentMessages(conversation.id),
  };
}

export async function getUserUnreadCount(userId: string): Promise<number> {
  const conversation = await db.query.supportConversations.findFirst({
    where: eq(supportConversations.userId, userId),
    columns: { userUnreadCount: true },
  });
  return conversation?.userUnreadCount ?? 0;
}

/** Active quick answers for the chat widget — cached; the admin FAQ actions bust the tag. */
export const getActiveFaqs = unstable_cache(
  async (): Promise<FaqDTO[]> =>
    db
      .select({ id: faqs.id, question: faqs.question, answer: faqs.answer })
      .from(faqs)
      .where(eq(faqs.isActive, true))
      .orderBy(asc(faqs.displayOrder), asc(faqs.createdAt)),
  ["active-faqs"],
  { tags: [FAQS_CACHE_TAG], revalidate: 3600 }
);

const CONVERSATION_COLUMNS = {
  id: supportConversations.id,
  userId: supportConversations.userId,
  userName: user.name,
  userEmail: user.email,
  userPhone: user.phone,
  status: supportConversations.status,
  adminUnreadCount: supportConversations.adminUnreadCount,
  lastMessagePreview: supportConversations.lastMessagePreview,
  lastMessageAt: supportConversations.lastMessageAt,
};

function toSummary(row: {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "open" | "closed";
  adminUnreadCount: number;
  lastMessagePreview: string | null;
  lastMessageAt: Date;
}): AdminConversationSummary {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    status: row.status,
    adminUnreadCount: row.adminUnreadCount,
    lastMessagePreview: row.lastMessagePreview,
    lastMessageAt: row.lastMessageAt.toISOString(),
  };
}

/** Conversations needing attention first (unread), then most recently active. */
export async function listAdminConversations(): Promise<AdminConversationSummary[]> {
  const rows = await db
    .select(CONVERSATION_COLUMNS)
    .from(supportConversations)
    .innerJoin(user, eq(user.id, supportConversations.userId))
    .orderBy(
      desc(sql`(${supportConversations.adminUnreadCount} > 0)`),
      desc(supportConversations.lastMessageAt)
    )
    .limit(100);
  return rows.map(toSummary);
}

export async function getAdminThread(conversationId: string): Promise<AdminThreadDTO | null> {
  const [row] = await db
    .select(CONVERSATION_COLUMNS)
    .from(supportConversations)
    .innerJoin(user, eq(user.id, supportConversations.userId))
    .where(eq(supportConversations.id, conversationId))
    .limit(1);
  if (!row) return null;

  return {
    conversation: { ...toSummary(row), userPhone: row.userPhone },
    messages: await getRecentMessages(conversationId),
  };
}

/** Total unread messages across open conversations — drives the sidebar badge and toast. */
export async function getAdminUnreadTotal(): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${supportConversations.adminUnreadCount}), 0)::int` })
    .from(supportConversations)
    .where(and(sql`${supportConversations.adminUnreadCount} > 0`));
  return row?.total ?? 0;
}
