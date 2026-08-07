# Admin Dashboard Specification

Covers every admin section from the original project brief: Dashboard, Products, Categories, Orders, Customers, Inventory, Coupons, Reviews, Analytics, Settings. **Homepage Banners is intentionally absent** — that feature was cut entirely back in the Homepage milestone (`specs/05`), so there's no corresponding admin section for it.

All routes here live under the `(admin)` route group, already protected by the role-based middleware defined in `specs/03` (session required **and** `role === "admin"`) — not re-specified here, just relied upon.

## New schema this milestone needed

A `platformSettings` key-value table (`db/schema/settings.ts`, already added) backs the Settings section — see its own section below. This resolves the "fast-follow once a settings table exists" notes left in `specs/10` and `specs/11`.

## Charting library decision

`specs/00`'s tech stack didn't name a charting library. **Decision: Recharts** — it's what shadcn/ui's own chart components are built on, so it fits the existing UI stack idiomatically rather than introducing a second, unrelated charting approach.

## Admin layout & navigation

- `(admin)/layout.tsx`: `AdminSidebar` (already referenced as a component in `specs/04`) with links to every section below.
- Consistent `DataTable` component (also flagged in `specs/04`) used across Products, Orders, Customers, Inventory, Coupons — one table implementation, not five slightly different ones.

## 1. Dashboard (`/admin`)

At-a-glance, today/this-week focused:
- KPI cards: **Total Orders** (all-time + this month), **Confirmed Revenue** (sum of `totalAmount` where `paymentStatus = "paid"`, plus COD orders where `status = "delivered"` — i.e., money actually collected, not just orders placed), **Awaiting Payment Confirmation** count (direct link to that Orders tab — see below), **New Customers this month**, **Low Stock alerts** count.
- Charts (Recharts): Orders over the last 30 days (line/bar), Top Selling Products (bar, from `products.salesCount`), Order Status breakdown (donut).
- Recent Orders table (latest ~10), linking to full Orders section.

## 2. Products (`/admin/products`)

- `DataTable`: thumbnail, name, category, price range (min–max across variants), total stock (summed across variants), active/inactive status, inline Featured/Trending toggles, actions (edit, soft-delete, duplicate).
- Filter by category and active status; search by name/SKU.
- **New/Edit Product** (`/admin/products/new`, `/admin/products/[id]/edit`) — a multi-section form:
  - Basic info: name, slug (auto-generated from name, editable), description, category select.
  - Variants: a dynamic repeatable list — each variant row has controlled-list attribute pickers (plating/color/size, from `constants/product-attributes.ts` per `specs/06` — not free text), price, `compareAtPrice`, SKU, stock quantity, and an "is default" toggle. **Exactly one variant must be marked default** — enforced in the form (selecting a new default automatically clears the previous one, mirroring the same single-default pattern already established for addresses in `specs/12`).
  - Images: Cloudinary upload, drag-to-reorder, set-primary, optionally scoped to a specific variant (per `specs/02`'s `productImages.variantId`).
- **Delete** is always **soft delete** (`deletedAt` set, `isActive` forced false) — never a hard delete from this UI, consistent with the schema's soft-delete design and the project's "never remove existing functionality/data" instinct. Soft-deleted products disappear from every customer-facing query but stay intact for historical reference.
- Bulk actions: bulk activate/deactivate, bulk Featured/Trending toggle (for handling seasonal pushes efficiently).

## 3. Categories (`/admin/categories`)

- List/tree view respecting the **two-level depth cap** decided in `specs/06` — the parent-category dropdown in the create/edit form only offers **top-level categories** as valid parents, which structurally prevents anyone from ever creating a third nesting level by accident.
- CRUD: name, slug, description, image, parent, `displayOrder` (drag-to-reorder list).
- **Delete protection:** `products.categoryId` uses `onDelete: "restrict"` (per `specs/02`), so the database itself will reject deleting a category that still has products assigned. The UI surfaces this as a friendly message — *"Can't delete: 12 products use this category. Reassign them first."* — rather than a raw database error bubbling up.

## 4. Orders (`/admin/orders`)

The most operationally important section, given the manual-payment model.

- **Tabs/filters:** All, Pending, Processing, Shipped, Delivered, Cancelled, and — the tab this whole payment model was designed around — **"Awaiting Payment Confirmation"** (`paymentStatus = "awaiting_confirmation"`). This is likely the default landing tab for daily operations, since it's the one requiring active admin attention (checking WhatsApp screenshots).
- Table columns: order reference, customer name, date, item count, total, payment method, payment status badge, order status badge.
- **Order detail view** — the same underlying data as the customer-facing detail from `specs/11`, with admin controls added:
  - **Advance order status** (`pending → processing → shipped → delivered`) via a simple control. **No courier/tracking-number field is introduced this milestone** — there's no shipping-carrier API integration in this project, so if an admin wants to note a courier reference, it goes in the existing `adminNotes` field rather than a new schema column. This is a deliberate v1 simplification, not an oversight.
  - **Confirm Payment** — visible specifically when `paymentStatus = "awaiting_confirmation"`, flips it to `"paid"`. This is the manual-verification step: the admin has already checked the customer's WhatsApp screenshot *outside the app* (screenshots are never uploaded into or stored by this system, per the original payment-model decision) and clicks this once satisfied.
  - **Mark Payment Received** for COD orders (`cod_pending → paid`) — kept as a **separate, deliberate action** from "Mark as Delivered," not an automatic side effect of delivery. Reasoning: a COD delivery attempt can fail (customer refuses, isn't home, disputes the amount) — collapsing "delivered" and "paid" into one click would misrepresent those edge cases.
  - **Cancel Order** — reuses the exact `cancelOrder` logic from `specs/11` (restock + coupon reversal), and follows the **same restriction**: only available from `pending`/`processing`, not `shipped`/`delivered`, for consistency between the customer- and admin-facing rules. A genuine edge-case override (e.g. disputed shipped order) would require direct database intervention — explicitly out of scope for this UI in v1.
- **Export to CSV** — a simple button, reusing the existing xlsx/CSV tooling already part of the stack; not elaborated further here since it's a straightforward data dump, not a design decision.

## 5. Customers (`/admin/customers`)

- Table: name, email, phone, role, joined date, total orders, total spent, email-verified badge.
- Customer detail view: that customer's order history (reuses `OrderList` from `specs/11`) and saved addresses.
- **Promote to Admin / Demote to Customer** — this is the intended path for creating admin #2, #3, etc. `specs/03` established that public sign-up never creates an admin and that the *first* admin comes from `db/seed.ts` — this dashboard action is how every subsequent admin is created, gated behind already being authenticated as an existing admin, which keeps that original security rule intact rather than contradicting it.
- **No account deletion from the admin side** — deletion is strictly self-service, per the email-confirmed flow already specified in `specs/12`. Admins can view and promote/demote here, nothing more destructive.

## 6. Inventory (`/admin/inventory`)

- Distinct purpose from Products: a **flat, stock-focused view** across all variants (not grouped by product edit-form), sortable by stock ascending, so low-stock items surface immediately.
- Filters: Low Stock, Out of Stock, All — using the **same thresholds already defined in `specs/06`** (`≤5` = Low Stock, `0` = Out of Stock), not a new/different threshold invented here.
- **Inline quick-edit** of `stockQuantity` directly in the table — this is the fast path for the frequent, low-friction task of "just update this number," without navigating into the full product edit form.

## 7. Coupons (`/admin/coupons`)

- `DataTable` + CRUD form matching the `coupons` schema exactly: code, type (percentage/fixed), value, `minOrderAmount`, `maxDiscountAmount`, usage limit, validity window (`startsAt`/`expiresAt`), active toggle.
- `usageCount` is shown **read-only** with a note that it's system-managed — incremented at checkout (`specs/09`/`specs/10`) and decremented on cancellation (`specs/11`), never manually edited here.

## 8. Reviews (`/admin/reviews`)

- Moderation queue: defaults to showing `isApproved = false` reviews (the actual queue needing attention), with **Approve** / **Delete** actions.
- A separate view/toggle for already-approved reviews, so an admin can un-approve or delete something after the fact (e.g. a review that turns out to violate guidelines after being live).
- Filterable by rating and by product.

## 9. Analytics (`/admin/analytics`)

Deeper, historical reporting — distinct from the Dashboard's at-a-glance today/this-week view:
- Adjustable date-range picker.
- Revenue over the selected range (chart), a fuller best-selling-products ranking (beyond the Dashboard's top 5), category performance breakdown, and a simple new-vs-returning-customer split.
- CSV export of the underlying data for the selected range.
- **Deliberately not more elaborate than this for v1** — deeper BI/cohort analysis is a plausible fast-follow, not a launch requirement.

## 10. Settings (`/admin/settings`)

Backed by the new `platformSettings` key-value table. Editable fields:
- EasyPaisa number
- JazzCash number
- WhatsApp business number
- Flat shipping rate (PKR) — currently 250, per `specs/09`/`specs/10`, now admin-adjustable instead of a hardcoded constant
- Auto-cancel unpaid manual-transfer threshold (hours) — currently 48, per `specs/11`, now admin-adjustable

Also on this page: the admin's own profile/password change, reusing the exact `ProfileForm`/`ChangePasswordForm` components already built in `specs/12` rather than duplicating them.

**Explicitly not exposed here:** brand visual identity (colors, fonts, tagline). Those stay code-level (Tailwind config / `constants/brand.ts`) — they're a design-system concern, not a day-to-day operational setting, and keeping them out of a runtime-editable form prevents an accidental brand-breaking change from a settings page.

## Files this milestone touches (for Claude Code's reference)
- `db/schema/settings.ts` (already added, typechecked) + a seed for its default rows
- `app/(admin)/layout.tsx`, `app/(admin)/admin/page.tsx` (Dashboard)
- `app/(admin)/admin/products/page.tsx`, `.../new/page.tsx`, `.../[id]/edit/page.tsx`
- `app/(admin)/admin/categories/page.tsx`
- `app/(admin)/admin/orders/page.tsx` + detail view
- `app/(admin)/admin/customers/page.tsx` + detail view
- `app/(admin)/admin/inventory/page.tsx`
- `app/(admin)/admin/coupons/page.tsx`
- `app/(admin)/admin/reviews/page.tsx`
- `app/(admin)/admin/analytics/page.tsx`
- `app/(admin)/admin/settings/page.tsx`
- `features/admin/components/`: `DataTable`, `StatsCard` (both already flagged in `specs/04`), plus `ProductForm`, `VariantRepeater`, `ImageUploader`, `OrderDetailAdmin`, `ConfirmPaymentButton`, `MarkPaymentReceivedButton`, `CustomerDetail`, `InventoryQuickEditRow`, `CouponForm`, `ReviewModerationCard`, `AnalyticsCharts`, `SettingsForm`
- `actions/admin/`: `products.actions.ts`, `categories.actions.ts`, `orders.actions.ts` (`confirmPayment`, `markCodPaymentReceived`, `advanceOrderStatus`), `customers.actions.ts` (`promoteToAdmin`, `demoteToCustomer`), `inventory.actions.ts`, `coupons.actions.ts`, `reviews.actions.ts`, `settings.actions.ts`
