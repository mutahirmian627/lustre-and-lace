import { pgTable, pgEnum, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const inquiryStatusEnum = pgEnum("inquiry_status", ["new", "in_progress", "won", "closed"]);

/**
 * A "start a project" enquiry from the studio side of the site. Anyone can submit one, so there
 * is no user relation — the contact details live on the row itself.
 */
export const projectInquiries = pgTable(
  "project_inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    businessName: text("business_name").notNull(),
    industry: text("industry"),
    // Service slugs from constants/agency.ts (e.g. "ecommerce"), kept as plain text so the list can
    // change without a migration.
    services: text("services").array().notNull().default([]),
    budgetRange: text("budget_range"),
    existingWebsite: text("existing_website"),
    message: text("message").notNull(),
    status: inquiryStatusEnum("status").notNull().default("new"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    statusCreatedIdx: index("project_inquiries_status_created_idx").on(table.status, table.createdAt),
  })
);
