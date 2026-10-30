import { pgTable, pgEnum, text, timestamp, integer, boolean, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./users";

export const supportStatusEnum = pgEnum("support_status", ["open", "closed"]);
export const supportSenderEnum = pgEnum("support_sender", ["user", "admin"]);

/**
 * Admin-authored quick answers shown in the chat widget. Readable without an
 * account, so they never contain anything account-specific.
 */
export const faqs = pgTable("faqs", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * One running conversation per customer — a new message after the admin
 * closes it simply reopens it, so history stays in a single thread. The two
 * unread counters are denormalized so the badge polls never scan messages.
 */
export const supportConversations = pgTable(
  "support_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: supportStatusEnum("status").notNull().default("open"),
    adminUnreadCount: integer("admin_unread_count").notNull().default(0),
    userUnreadCount: integer("user_unread_count").notNull().default(0),
    lastMessagePreview: text("last_message_preview"),
    lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: uniqueIndex("support_conversations_user_idx").on(table.userId),
    lastMessageIdx: index("support_conversations_last_message_idx").on(table.lastMessageAt),
  })
);

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => supportConversations.id, { onDelete: "cascade" }),
    senderRole: supportSenderEnum("sender_role").notNull(),
    // The admin who replied; null for customer messages.
    senderId: uuid("sender_id").references(() => user.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    conversationIdx: index("support_messages_conversation_idx").on(table.conversationId, table.createdAt),
  })
);

export const supportConversationsRelations = relations(supportConversations, ({ one, many }) => ({
  user: one(user, { fields: [supportConversations.userId], references: [user.id] }),
  messages: many(supportMessages),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  conversation: one(supportConversations, {
    fields: [supportMessages.conversationId],
    references: [supportConversations.id],
  }),
}));
