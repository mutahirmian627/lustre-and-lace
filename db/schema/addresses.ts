import { pgTable, text, timestamp, boolean, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./users";

/**
 * Saved addresses for logged-in customers (account/addresses page).
 * Kept separate from `orders.shippingAddress`, which is an immutable
 * snapshot — this table is the mutable, reusable version a customer
 * picks from at checkout.
 */
export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label"), // e.g. "Home", "Office"
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    province: text("province"),
    postalCode: text("postal_code"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("addresses_user_idx").on(table.userId),
  })
);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, { fields: [addresses.userId], references: [user.id] }),
}));
