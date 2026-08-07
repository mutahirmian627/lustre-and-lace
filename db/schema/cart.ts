import { pgTable, timestamp, integer, numeric, uuid, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./users";
import { products, productVariants } from "./products";

/**
 * `userId` is nullable and `guestToken` exists specifically to support
 * guest checkout (a project requirement) — a guest's cart is tracked by
 * a token stored in a cookie until they either check out or sign up.
 */
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
    guestToken: text("guest_token").unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("carts_user_idx").on(table.userId),
    guestTokenIdx: index("carts_guest_token_idx").on(table.guestToken),
  })
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "cascade",
    }),
    quantity: integer("quantity").notNull().default(1),
    // Snapshot of price when added, so an in-cart price change is visible
    // to the customer as a diff rather than silently changing their total.
    priceAtAdd: numeric("price_at_add", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    cartIdx: index("cart_items_cart_idx").on(table.cartId),
  })
);

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(user, { fields: [carts.userId], references: [user.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));
