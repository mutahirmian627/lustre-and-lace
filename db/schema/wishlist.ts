import { pgTable, timestamp, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./users";
import { products } from "./products";

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Prevents the same product being wishlisted twice by the same user.
    userProductUnique: uniqueIndex("wishlist_user_product_unique").on(
      table.userId,
      table.productId
    ),
    userIdx: index("wishlist_user_idx").on(table.userId),
  })
);

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(user, { fields: [wishlists.userId], references: [user.id] }),
  product: one(products, { fields: [wishlists.productId], references: [products.id] }),
}));
