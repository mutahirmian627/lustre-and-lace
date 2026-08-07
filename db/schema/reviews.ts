import { pgTable, text, timestamp, integer, boolean, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./users";
import { products } from "./products";
import { orders } from "./orders";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Optional link to a verified purchase — enables a "Verified Purchase"
    // badge later without making it mandatory for launch.
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    comment: text("comment"),
    // Reviews require admin approval before showing publicly.
    isApproved: boolean("is_approved").notNull().default(false),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    productIdx: index("reviews_product_idx").on(table.productId),
    approvedIdx: index("reviews_approved_idx").on(table.isApproved),
  })
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  user: one(user, { fields: [reviews.userId], references: [user.id] }),
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
}));
