import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user, roleEnum } from "./users";

/**
 * Every role change, written by the super-admin actions. Emails are copied in
 * so the history stays readable after an account is deleted (the user FKs
 * are set null, never cascaded).
 */
export const roleAuditLog = pgTable(
  "role_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    targetUserId: uuid("target_user_id").references(() => user.id, { onDelete: "set null" }),
    targetEmail: text("target_email").notNull(),
    actorUserId: uuid("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    actorEmail: text("actor_email").notNull(),
    fromRole: roleEnum("from_role").notNull(),
    toRole: roleEnum("to_role").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    createdIdx: index("role_audit_log_created_idx").on(table.createdAt),
  })
);
