# Checkout & Payments Specification

## Shipping (confirmed)
Flat rate, **PKR 250**, every order — see `specs/09-cart.md` for where this is finalized. Sourced from a single `constants/site-config.ts` value, never hardcoded per-file.

## Checkout page layout (`/checkout`)

Two-column: form fields left, order summary sidebar right (sticky on desktop, collapsible/below on mobile).

### 1. Contact information
- Full name, email, phone — required for **everyone**, including guests (an order needs a way to reach the customer regardless of account status).
- If logged in: pre-filled from `user` table, editable.

### 2. Shipping address
- Fields matching the `ShippingAddressSnapshot` shape already defined in `db/schema/orders.ts`: full name, phone, address line 1, address line 2 (optional), city, province (optional), postal code (optional).
- **Logged-in customers with saved addresses** (`addresses` table): a selector showing saved addresses (label + short preview) plus an "Add new address" option — picking one pre-fills the form.
- A "Save this address for next time" checkbox (checked by default for logged-in users, hidden entirely for guests since there's no account to attach it to) — on submit, this either creates a new `addresses` row or is skipped, independent of what actually gets stored on the order itself.
- **Important distinction, consistent with `specs/02`:** what's saved on the *order* (`orders.shippingAddress`) is always an immutable snapshot of what was typed at checkout time — independent of whether the customer later edits or deletes the saved address record.

### 3. Payment method
- Two radio-style options, matching `orders.paymentMethod`:
  - **Cash on Delivery**
  - **Bank Transfer (EasyPaisa / JazzCash)**
- No sub-selection needed between EasyPaisa and JazzCash at this step — both numbers are shown together on the confirmation page, and the customer sends via whichever they actually have. The `paymentMethod` enum stays exactly as already defined in the schema (`cod | manual_transfer`); no schema change from this decision.

### 4. Coupon (compact re-entry point)
- Same `CouponInput` component from the Cart milestone; if a coupon was already applied in the cart, it carries through and is shown as applied (not re-typed).

### 5. Order summary sidebar
- Collapsed line items (thumbnail, name, variant, qty, price), Subtotal, Discount, Shipping (PKR 250 flat), **Total**.
- "Place Order" button — the one irreversible action on this page.

## Order placement — server-side flow (on "Place Order")

This is the most correctness-sensitive operation in the whole app (it's the closest thing to a financial transaction this project has, even without a payment gateway), so it runs as a **single database transaction** — if any step fails, nothing partially commits:

1. **Re-validate the cart server-side** — re-check every line item's stock and current price. Never trust whatever the client last rendered (per the project's standing validation rule). If anything has changed (out of stock, price changed materially), the transaction aborts and the customer sees a clear, specific message — not a generic error.
2. **Re-validate the coupon** (if applied) — active, within date range, `minOrderAmount` met, under `usageLimit` — exactly as it was checked in the cart, checked again here since time has passed since the cart page loaded.
3. **Compute final amounts:** `subtotal`, `discountAmount`, `shippingAmount` (= 250), `totalAmount`.
4. **Generate the order reference** — see dedicated section below.
5. **Create the `orders` row** — `status: "pending"`, and `paymentStatus` set based on method:
   - `cod` → `paymentStatus: "cod_pending"`
   - `manual_transfer` → `paymentStatus: "awaiting_confirmation"`
6. **Create `orderItems`** — snapshotting `productName`, `variantName`, `unitPrice` at time of purchase (per `specs/02`'s design rationale).
7. **Decrement `stockQuantity`** on each purchased variant **immediately at order placement**, not at payment confirmation. Decision reasoning: COD orders need stock reserved right away too (there's no payment event to hang the decrement on for COD), and waiting until "paid" for manual-transfer orders would let two customers both "buy" the last item before either one pays. If an order is later cancelled, stock must be restored — **flagged as a required dependency for the Orders/Admin milestone's cancel flow**, not solved here.
8. **Increment `coupons.usageCount`** if a coupon was applied.
9. **Clear the cart** (delete the `cartItems` rows, and the `carts` row itself if empty) on successful commit.
10. **Send an order confirmation email** (Resend, `emails/order-confirmation.tsx`) to `customerEmail` — includes the order reference, items, total, and payment-method-specific next steps (mirroring the confirmation page below).
11. **Redirect to `/checkout/confirmation/[orderId]`.**

If the transaction fails at any point, nothing above has happened — the customer is still looking at a submittable checkout form with a clear error, not a half-created order.

## Order reference generation

- Format: `LL-{year}-{5-digit sequence}` (e.g. `LL-2026-00842`), matching the original design intent from the project's early planning.
- **Decision: backed by a Postgres `SEQUENCE`**, not a "count existing orders + 1" approach — counting rows is vulnerable to race conditions under concurrent checkouts (two customers checking out at the same instant could compute the same "next number"). A sequence guarantees atomic, gap-tolerant uniqueness under concurrency.
- **Not yet added to the schema files** — like the search milestone's `tsvector` trigger, a Postgres sequence is a raw-SQL migration concern, not a plain Drizzle column, so it's flagged here as a required addition for whoever implements this milestone rather than half-added now.
- The year portion resets logically each year since the sequence value itself keeps climbing — implementation detail to settle when built (e.g. either reset the sequence on Jan 1 via a scheduled job, or accept that the numeric part is simply cumulative across years and only the year *label* changes). Flagging this as a small open detail, not a blocker.

## Confirmation page (`/checkout/confirmation/[orderId]`)

Content differs by `paymentMethod`:

### Cash on Delivery
- Order reference, item summary, total.
- Simple confirmation: "Your order has been placed! Pay in cash when it arrives." No further action needed from the customer.

### Bank Transfer (manual)
- Order reference and **exact total amount to send**, shown prominently (large, unmistakable — this is the number most likely to get mistyped by a customer sending money).
- Both numbers from `constants/brand.ts`: EasyPaisa number and JazzCash number, clearly labeled.
- Explicit instruction to **include the order reference** in the transfer if the app supports a note field, and regardless to quote it over WhatsApp.
- **"Send Payment Screenshot on WhatsApp"** button — a `wa.me` deep link (built by `services/whatsapp.service.ts`) pointing at the business WhatsApp number, pre-filled with a message like *"Hi, here's my payment for order LL-2026-00842."* This opens WhatsApp with the message drafted; the customer still manually attaches their screenshot on their end — that's the practical limit of what a `wa.me` link can automate, worth stating plainly rather than implying more automation than exists.
- A short note that the order will be processed once payment is verified — sets expectations without needing real-time payment status.

## Guest checkout — account creation nudge (optional, not required)

After a guest places an order, the confirmation page can show a soft, dismissible prompt: *"Create an account to track this order and future ones"* — pre-filled with the email they just used. This is optional and never blocks the flow; `orders.userId` legitimately stays `null` for guest orders indefinitely if they don't take the prompt.

## What's explicitly deferred to later milestones
- **Order tracking for guests** (looking up an order by reference + email, without an account) — this fits naturally into the Orders milestone (which also builds the admin-side "awaiting payment confirmation" view), not this one. Flagged as a dependency, not solved here.
- **Restocking on order cancellation** — flagged above, belongs to Orders/Admin.
- **Auto-cancelling unpaid manual-transfer orders after N hours** — a good idea raised during the original payment-model discussion, still a good idea, still deferred to the Orders/Admin milestone as an admin-configurable setting, not built now.

## Files this milestone touches (for Claude Code's reference)
- `app/(storefront)/checkout/page.tsx`, `app/(storefront)/checkout/confirmation/[orderId]/page.tsx`
- `features/checkout/components/`: `ContactInfoForm`, `ShippingAddressForm`, `SavedAddressSelector`, `PaymentMethodSelector`, `OrderSummarySidebar`, `EasyPaisaJazzCashInstructions`, `CODConfirmation`
- `utils/generate-order-reference.ts` (calls the Postgres sequence)
- `services/whatsapp.service.ts` (`buildWhatsAppLink(orderReference, businessNumber)`)
- `constants/brand.ts` — EasyPaisa number, JazzCash number, WhatsApp business number (**placeholder values until real numbers are provided — must be filled in before launch**), `FLAT_SHIPPING_RATE_PKR`
- `actions/checkout.actions.ts`: `placeOrder(...)` (the full transactional flow above)
- `emails/order-confirmation.tsx`
- `db/migrations/` — the order-reference sequence (raw SQL, alongside the search milestone's trigger)
