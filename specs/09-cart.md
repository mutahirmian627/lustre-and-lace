# Cart Specification

## State management approach

**Decision: React Context, not TanStack Query**, per the tech-stack rule in `specs/00` (Context for shared app state, TanStack Query reserved for genuine client-refetch cases like admin tables). Cart is low-frequency, mutation-driven, and server-authoritative — a `CartProvider` wraps the storefront, holds the current cart's items/totals in state, and every mutation (`addItem`, `updateQuantity`, `removeItem`, `applyCoupon`) calls a Server Action and updates local state from its response. There's no polling need that would justify TanStack Query here.

## Guest vs. logged-in carts (already defined in schema, behavior confirmed here)

- Guest: identified by a long-lived `guestToken` cookie (e.g. 30 days), matching `carts.guestToken`.
- Logged-in: `carts.userId`.
- **Merge-on-login behavior is already fully specified in `specs/03-authentication.md`** (sum overlapping quantities, cap at stock, clear guest cart after merge) — not re-specified here, just confirmed as the dependency this milestone relies on.

## Price consistency policy (resolves the purpose of `cartItems.priceAtAdd`)

`cartItems.priceAtAdd` exists specifically so a price change between "added to cart" and "viewing cart" is visible, not silently absorbed. **Decision:**
- The cart **displays and totals using the variant's current live price**, not the stale `priceAtAdd` — the business needs the actual current price to be what gets charged, not a snapshot from whenever the item was added.
- If `priceAtAdd !== currentPrice`, show a small inline note on that line item ("Price updated since you added this") rather than silently changing the number with no explanation — this is a trust/transparency detail, not just a cosmetic one.
- `priceAtAdd` is **not** updated to match the new price on view — it stays as the original snapshot for as long as the item remains in the cart, so the "price changed" note continues to be accurate rather than resetting itself.

## Stock validation in cart

- On loading the cart page (and the mini drawer), each line item's requested `quantity` is checked against the variant's current `stockQuantity`.
- If stock has dropped below the requested quantity (someone else bought the last few, or an admin adjusted inventory): the line item shows an inline warning and its quantity is **capped to available stock** in the display (not silently changed in the database until the customer takes an action or proceeds to checkout, where it's finalized).
- If stock is now `0`: the item is flagged "No longer available" with a **Remove** action; it cannot be included in checkout totals until removed.
- This check re-runs at the start of checkout as well (defense in depth — never trust that what was true when the cart page loaded is still true by the time the customer clicks "Place Order").

## No in-cart variant switching (v1 scope decision)

Changing plating/size for an item already in the cart is **not supported inline**. To change a variant, the customer removes the item and re-adds the correct variant from the PDP. This keeps the cart UI and its underlying `updateQuantity`/`removeItem` actions simple — a "swap variant" action would need its own stock/price re-validation logic duplicating what the PDP already does well. Revisit only if user feedback specifically calls for it post-launch.

## Coupon application

- **Decision: no `couponId` column added to `carts`.** The applied coupon code is kept as **ephemeral client state** (not persisted against the cart row) while shopping, and is **re-validated server-side at checkout** before being attached to the actual `orders.couponId`. This avoids a schema addition for something that's genuinely provisional until the order is placed, and it satisfies the "never trust client input" rule by re-checking validity (active, date range, `minOrderAmount`, usage limit) at the moment it actually matters.
- Coupon input lives on both the full Cart page and (compact) the checkout page; applying it calls a server action (`validateCoupon(code, cartSubtotal)`) that returns the computed discount or a clear rejection reason ("This code has expired," "Minimum order amount not met," etc.) — never a generic failure message.
- Discount calculation: `percentage` type discount is capped by `maxDiscountAmount` when set; `fixed` type is a flat subtraction, never exceeding the subtotal (floor at zero, not negative).

## Shipping cost — resolved

**Decision: flat rate, PKR 250, on every order** — regardless of destination or order value. No free-shipping threshold for now. This is stored as a single named constant (`constants/site-config.ts` → e.g. `FLAT_SHIPPING_RATE_PKR = 250`), not hardcoded inline anywhere, so it can be changed in one place later if a free-shipping promotion is introduced.

With this resolved, the cart page **can** now show a final, accurate total (Subtotal − Discount + 250 = Total) rather than the "calculated at checkout" placeholder described below — that placeholder language is superseded by this decision.

## Mini Cart Drawer (header trigger, `Sheet`-based)

- Compact line items: thumbnail, name, selected variant label, quantity (small stepper), price, remove (×).
- Running subtotal at the bottom.
- Two actions: **"View Cart"** (→ `/cart`) and **"Checkout"** (→ `/checkout`) — the drawer itself doesn't try to do full cart management (no coupon field here, no stock-warning detail) to keep it fast and glanceable; anything more involved sends the customer to the full cart page.
- Opens automatically right after "Add to Cart" is clicked from a PDP or `ProductCard`, briefly confirming what was just added (a common, expected pattern) — then can be dismissed or left open.

## Full Cart Page (`/cart`)

- Line items: thumbnail, name + variant label (linked back to the PDP), quantity stepper (capped at available stock, per the validation above), unit price, line total, remove.
- Order summary panel: Subtotal, Discount (if coupon applied, with a way to remove the coupon), flat Shipping fee (PKR 250, per `constants/site-config.ts`), and a final **Total** — no longer a placeholder, since shipping is now a known flat rate (see resolved decision above).
- Primary CTA: **"Proceed to Checkout"** — disabled if any line item is flagged unavailable (stock issue) until resolved.
- **Empty state:** shared `EmptyState` — "Your cart is empty," CTA to `/products`.

## Files this milestone touches (for Claude Code's reference)
- `features/cart/components/`: `MiniCartDrawer`, `CartLineItem`, `CartSummary`, `CouponInput`, `QuantityStepper` (shared with wishlist's add-to-cart and PDP if not already generalized there)
- `features/cart/hooks/`: `useCart` (Context consumer) and the `CartProvider` itself (likely placed in `app/layout.tsx` or a dedicated providers file so it wraps the whole storefront)
- `app/(storefront)/cart/page.tsx`
- `actions/cart.actions.ts`: `addToCart`, `updateCartItemQuantity`, `removeCartItem`, `getCart` (includes live stock/price re-check), `validateCoupon`, plus the already-specified `mergeGuestCart` from the Auth milestone
