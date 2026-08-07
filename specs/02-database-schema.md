# Database Schema Specification

> The actual Drizzle schema code already exists in `db/schema/*.ts` and `db/index.ts` in this
> project folder, fully typechecked in strict mode. This document explains the *design
> rationale* so Claude Code (or any engineer) understands *why* the schema is shaped this way
> before touching it.

## Tables

| File | Tables | Purpose |
|---|---|---|
| `users.ts` | `user`, `session`, `account`, `verification` | Better Auth–compatible auth tables, extended with `role` and `phone` on `user` |
| `categories.ts` | `categories` | Self-referencing (via `parentId`) — covers both flat categories (Rings, Bangles) and collection groupings (Wedding, Party, Everyday) in one table |
| `products.ts` | `products`, `productVariants`, `productImages` | Product "card" → purchasable variants (plating/color/size) → images (product- or variant-scoped) |
| `cart.ts` | `carts`, `cartItems` | Supports both logged-in (`userId`) and guest (`guestToken`) carts |
| `wishlist.ts` | `wishlists` | Unique constraint on `(userId, productId)` prevents duplicate saves |
| `coupons.ts` | `coupons` | Percentage or fixed discount codes with usage limits and validity windows |
| `orders.ts` | `orders`, `orderItems` | Order + line items, with manual-payment fields (see below) |
| `reviews.ts` | `reviews` | Product reviews, admin-moderated (`isApproved`), optionally linked to a verified order |
| `addresses.ts` | `addresses` | Saved, reusable customer addresses (mutable) — distinct from the immutable shipping snapshot on `orders` |

## Key design decisions

1. **UUID primary keys everywhere**, including on Better Auth's tables — configured via the Drizzle adapter rather than Better Auth's default text IDs.
2. **Variants are first-class, not an afterthought.** Jewellery has real variation (gold/silver/rose-gold plating, stone color, size). `products` is the listing card; `productVariants` holds the actual SKU, price, and stock; `productImages` can point at a variant specifically.
3. **Payment fields are decoupled from fulfillment status.** `orders.status` (`pending → processing → shipped → delivered → cancelled`) is independent from `orders.paymentStatus` (`cod_pending | awaiting_confirmation | paid | failed | refunded`) and `orders.paymentMethod` (`cod | manual_transfer`). An order can be `processing` for shipping while payment is still `awaiting_confirmation` pending WhatsApp screenshot review — this reflects the real manual-verification workflow (full flow in `05-checkout-and-payments.md`).
4. **Order line items snapshot data at time of purchase** (`productName`, `variantName`, `unitPrice` are copied, not just foreign-keyed) so a later product rename/reprice never rewrites history. Foreign keys use `set null` on delete so line items survive product deletion.
5. **Guest checkout is structural, not bolted on.** `carts.userId` and `orders.userId` are both nullable; guests are tracked via `carts.guestToken`. Cart merge-on-login behavior is specified in `03-authentication.md`.
6. **Soft deletes** (`deletedAt`) on `products`, `categories`, `reviews`, `orders` — admin "deletes" never break historical order/analytics references.
7. **Order reference vs. UUID.** `orders.orderReference` (e.g. `LL-2026-00842`) is a separate, human-readable, unique field — never exposes the internal UUID to customers or support conversations.

## Indexing strategy
Foreign key columns used in lookups (`categoryId`, `productId`, `userId`, `cartId`, `orderId`) and status/filter columns used in admin dashboards (`isActive`, `isFeatured`, `status`, `paymentStatus`) are indexed. Unique indexes enforce `slug`, `sku`, `email`, `orderReference`, and the wishlist `(userId, productId)` pair.

## What's intentionally deferred
- No `productAttributes` taxonomy table (e.g. a formal "Plating" attribute type) — variant `attributes` is a flexible `jsonb` bag for now. Revisit if the admin UI needs structured attribute filtering at scale.
- No `inventoryLog`/stock movement history table yet — `stockQuantity` is a simple counter on `productVariants`. Add an audit table only if inventory discrepancies become a real problem.
- No Homepage Banners table and no Newsletter Subscribers table — both features were dropped from scope (see `05-homepage-and-navigation.md`), so no schema was added for them.

## Homepage-driven additions (decided during the Homepage & Navigation milestone)
- `products.salesCount` (integer, default 0): a maintained counter, not a live aggregate. Incremented when an order's `paymentStatus` becomes `"paid"` (or on COD delivery, per whatever fulfillment rule is finalized in the Orders milestone). Chosen deliberately over computing sales totals from `orderItems` on every homepage load — Best Sellers needs to be fast and cheap, and a counter avoids a join+aggregate on a page that must render quickly.
- `products.isTrending` (boolean, default false, indexed): admin-curated flag for the homepage Trending Products section. Not derived from analytics — the admin decides what's "trending," giving direct editorial control rather than an algorithm that could surface the wrong products.
