import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { categories } from "./categories";

/**
 * Products are the "card" shown in listings — one product can have many
 * purchasable variants (see productVariants) so that a single necklace
 * design available in gold-plated / silver-plated / rose-gold-plated
 * doesn't need to be duplicated as three separate products.
 */
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    // Base/display price shown on listing cards before variant selection.
    basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
    sku: text("sku").unique(),
    ratingAverage: numeric("rating_average", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    ratingCount: integer("rating_count").notNull().default(0),
    // Maintained counter, incremented when an order's paymentStatus moves to
    // "paid" (or on COD delivery). Chosen over an on-demand aggregate over
    // orderItems because Best Sellers needs to be fast and cheap on every
    // homepage load, not recomputed from scratch each time.
    salesCount: integer("sales_count").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    // Admin-curated flag for the homepage Trending Products section —
    // deliberately not derived from views/orders, so the admin has direct
    // editorial control over what "trending" means.
    isTrending: boolean("is_trending").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("products_category_idx").on(table.categoryId),
    featuredIdx: index("products_featured_idx").on(table.isFeatured),
    trendingIdx: index("products_trending_idx").on(table.isTrending),
    activeIdx: index("products_active_idx").on(table.isActive),
  })
);

/**
 * Purchasable SKUs. `attributes` is a flexible jsonb bag (e.g.
 * { plating: "Rose Gold", size: "Adjustable" }) so we don't need a rigid
 * fixed set of variant dimensions across every jewellery category.
 */
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "Rose Gold - Adjustable"
    sku: text("sku").unique(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    productIdx: index("variants_product_idx").on(table.productId),
  })
);

/**
 * Images can belong to a product generally, or to one specific variant
 * (e.g. a close-up of the rose-gold finish) via the nullable `variantId`.
 */
export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "cascade",
    }),
    url: text("url").notNull(), // Cloudinary URL
    altText: text("alt_text"),
    displayOrder: integer("display_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    productIdx: index("images_product_idx").on(table.productId),
    variantIdx: index("images_variant_idx").on(table.variantId),
  })
);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));
