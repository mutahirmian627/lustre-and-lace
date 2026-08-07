import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  uuid,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./users";
import { products, productVariants } from "./products";
import { coupons } from "./coupons";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

/**
 * Only two payment methods for now, per current business decision.
 * Adding a real gateway later is just a new enum value — no schema
 * migration of existing columns required.
 */
export const paymentMethodEnum = pgEnum("payment_method", ["cod", "manual_transfer"]);

/**
 * Deliberately separate from `orderStatusEnum` — fulfillment and payment
 * verification move independently. A manual-transfer order can be
 * "processing" for shipping purposes while payment is still
 * "awaiting_confirmation" pending a WhatsApp screenshot review.
 */
export const paymentStatusEnum = pgEnum("payment_status", [
  "cod_pending",
  "awaiting_confirmation",
  "paid",
  "failed",
  "refunded",
]);

/**
 * Shipping address is stored as a snapshot (jsonb), not a foreign key to
 * a saved address — so if the customer edits/deletes a saved address later,
 * the historical order still shows exactly where it was shipped.
 */
export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province?: string;
  postalCode?: string;
}

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Human-readable reference shown to customers (e.g. "LL-2026-00842").
    // Kept separate from the UUID `id` so internal identifiers are never
    // exposed to customers or used in WhatsApp/support conversations.
    orderReference: text("order_reference").notNull().unique(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddressSnapshot>().notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    shippingAmount: numeric("shipping_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    customerNotes: text("customer_notes"),
    adminNotes: text("admin_notes"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("orders_user_idx").on(table.userId),
    statusIdx: index("orders_status_idx").on(table.status),
    paymentStatusIdx: index("orders_payment_status_idx").on(table.paymentStatus),
    referenceIdx: index("orders_reference_idx").on(table.orderReference),
  })
);

/**
 * Line items snapshot product/variant name and price at time of purchase.
 * This is intentional duplication: if a product is renamed or repriced
 * later, past orders must continue to show what was actually bought/paid.
 * `productId`/`variantId` use `set null` on delete so historical line
 * items survive even if the product is later removed entirely.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    variantName: text("variant_name"),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index("order_items_order_idx").on(table.orderId),
  })
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  coupon: one(coupons, { fields: [orders.couponId], references: [coupons.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));
