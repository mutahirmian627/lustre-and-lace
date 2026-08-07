# Orders Specification

This milestone covers customer-facing order history/tracking and the underlying business rules (status transitions, cancellation, restocking, auto-cancel). The **admin-side management UI** (the dashboard's Orders tab, including the "awaiting payment confirmation" filter referenced back in the original payment-model discussion) is built in the Admin Dashboard milestone — this spec defines the rules that UI will operate on, so they're not invented twice.

## Order status model

- Happy path (forward-only): `pending → processing → shipped → delivered`.
- `cancelled` is reachable only from `pending` or `processing` — **not** from `shipped` or `delivered`. Once an order has shipped, undoing it is a return/refund, which is a genuinely different process (physical item already in transit or delivered) and there's no `returns` schema in this project (the footer's "Return Policy" link is static informational content, not a processing flow). **Returns/refunds-after-delivery are explicitly out of scope for v1** — flagged here plainly rather than left ambiguous.
- Status changes are **admin-driven** (via the Admin Dashboard milestone's UI) except for: order creation (always starts `pending`) and customer self-cancellation (below) and the auto-cancel job (below).
- `orderStatus` and `paymentStatus` remain decoupled exactly as designed in `specs/02` — nothing in this milestone changes that.

## Customer self-cancellation

- **Decision: customers can cancel only while status is still `pending`.** Once an admin has moved an order to `processing`, fulfillment work has likely already started (packing, etc.), so self-service cancellation is turned off — the customer would need to contact support (WhatsApp/contact page) instead. This is a simple, safe v1 rule that avoids racing against in-progress fulfillment.
- Cancelling triggers the same restock + coupon-reversal logic described below, regardless of whether the cancellation was customer- or admin-initiated.

## Cancellation side effects (resolves the dependency flagged in `specs/10`)

Whenever an order transitions to `cancelled` (customer self-cancel, admin cancel, or the auto-cancel job):
1. **Restock:** for every `orderItem`, increment the corresponding `productVariants.stockQuantity` back by the cancelled quantity. This is the resolution of the dependency flagged in the Checkout milestone (stock was decremented at order placement, so cancellation must reverse it).
2. **Coupon reversal:** if the order used a coupon, decrement `coupons.usageCount` by 1 — the usage didn't actually happen, so it shouldn't count against the coupon's limit.
3. **Payment status handling:**
   - If `paymentStatus` was `awaiting_confirmation` or `cod_pending` → set to `failed` (the payment never completed).
   - If `paymentStatus` was already `paid` (an edge case — a verified manual-transfer order gets cancelled after the fact) → set to `refunded`. The actual money movement back to the customer is **manual** (there's no gateway to automate it) — the app only records that a refund is owed/done; the admin handles the real EasyPaisa/JazzCash transfer outside the system.

## Auto-cancelling unpaid manual-transfer orders

This was flagged as a good idea back when the payment model was first designed, and it's resolved here:

- **v1 approach:** a fixed constant (`AUTO_CANCEL_UNPAID_HOURS`, e.g. 48) in `constants/site-config.ts` — **not** yet an admin-configurable setting, since there's no `settings` table in the schema (the Admin Dashboard milestone's "Settings" section is where a proper key-value settings table would eventually live). Making this configurable is a natural fast-follow once that table exists; hardcoding a sensible default now is not a shortcut worth blocking on.
- **Mechanism:** a scheduled job (Vercel Cron, hitting a protected route) runs periodically, finds orders where `paymentMethod = "manual_transfer"`, `paymentStatus = "awaiting_confirmation"`, `status = "pending"`, and `createdAt` older than the threshold — and cancels them (full cancellation side effects above apply).
- This requires a new route not yet listed in `specs/01`: `app/api/cron/auto-cancel-unpaid-orders/route.ts`, secured by a shared secret header (Vercel Cron supports this) so it can't be triggered by an arbitrary external request.
- COD orders are **not** subject to auto-cancel — there's no "unpaid" signal for COD the way there is for manual transfer; COD orders just sit in `cod_pending` until delivery.

## Customer order history (`/account/orders`)

- List of the logged-in user's orders (`orders.userId = current user`), newest first, paginated.
- Each row: order reference, date, thumbnail(s) of items, `orderStatus` badge, `paymentStatus` badge (color-coded, distinct enough from `orderStatus` badges that the two don't get visually confused), total, link to detail.

### Order detail (`/account/orders/[orderId]`)
- Full line items (image, name, variant, qty, unit price, line total).
- Shipping address snapshot as it was at order time.
- Payment method + status.
- A simple visual status timeline (`Pending → Processing → Shipped → Delivered`, with `Cancelled` shown as a distinct end-state icon/color if applicable, not squeezed into the same forward timeline).
- **Cancel Order** button — visible only when `status === "pending"`, per the policy above; confirmation dialog before committing (this is a destructive action, gets the same care as any irreversible click).
- **Reorder** button — adds all of this order's items back into the cart, matching by variant if it still exists and is active; unavailable/out-of-stock items are skipped with a summary toast (mirrors the wishlist's "Add All to Cart" summary-toast pattern from `specs/08`) rather than silently dropped or blocking the whole reorder.
- For `delivered` orders: a "Leave a Review" link per item, feeding into the PDP's review form (already gated on verified email per `specs/06`), pre-linking `reviews.orderId` to this order for the "verified purchase" signal.

## Guest order tracking (`/track-order`)

- Public page, linked from the footer's "Track Order" link (already listed in `specs/05`).
- Form: **Order Reference + Email** (both required together — looking up by reference alone would let anyone probe for order references and see someone else's order, which is a real enumeration risk worth guarding against explicitly).
- Returns a **read-only** view of the order (status timeline, items, total) — no cancel or reorder actions here. **Decision:** a guest wanting to cancel must reach out via WhatsApp/contact rather than self-service cancel through this page — keeping an unauthenticated page read-only avoids having to reason about authorizing a destructive action without a real session.
- This is the resolution of the guest-tracking dependency explicitly deferred from `specs/10`.

## Files this milestone touches (for Claude Code's reference)
- `app/(account)/account/orders/page.tsx`, `app/(account)/account/orders/[orderId]/page.tsx`
- `app/(storefront)/track-order/page.tsx` — **new page, not previously listed in `specs/01`**, add it there when implementing
- `app/api/cron/auto-cancel-unpaid-orders/route.ts` — **new route, not previously listed in `specs/01`**
- `features/account/components/`: `OrderList`, `OrderCard`, `OrderStatusBadge`, `PaymentStatusBadge`, `OrderTimeline`, `CancelOrderDialog`, `ReorderButton`
- `features/orders/components/GuestOrderLookupForm.tsx` (or colocated under `features/account/` if simpler — either is fine, just keep it in one place)
- `actions/orders.actions.ts`: `getOrdersForUser`, `getOrderById`, `trackGuestOrder(reference, email)`, `cancelOrder(orderId)` (enforces the `pending`-only rule and runs restock/coupon-reversal), `reorderItems(orderId)`
- `constants/site-config.ts` — add `AUTO_CANCEL_UNPAID_HOURS`
