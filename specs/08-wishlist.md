# Wishlist Specification

## Login requirement (resolves a structural gap from the schema)

`wishlists.userId` is `notNull` (per `specs/02`) — unlike `carts`, there's no guest-token fallback. **Decision: wishlist requires login, by design, not as an oversight.** Unlike cart (where forcing an account would hurt conversion for a first-time buyer), wishlisting is inherently a "save for later, come back as yourself" action — it's reasonable to ask for an account here. This also keeps the schema simple (no need for a second guest-merge flow beyond the one already specified for cart in `specs/03`).

- A guest clicking the wishlist heart sees a small prompt (toast or popover, not a full page redirect) — *"Sign in to save items to your wishlist"* — with a direct link to `/login?redirect={current-path}`. The click is **not** silently ignored; the customer gets clear feedback on why nothing happened.
- **Not implemented for v1:** remembering the guest's attempted wishlist item and auto-adding it after they log in. This is a nice-to-have, contained enhancement to revisit later, not a launch requirement.

## Resolving the duplicate wishlist page in the folder structure

`specs/01` lists a wishlist page in **two** places: `(storefront)/wishlist/page.tsx` (→ `/wishlist`) and `(account)/account/wishlist/page.tsx` (→ `/account/wishlist`). Building two separate pages against the same data would be duplicated UI work for no real benefit. **Decision: one canonical implementation at `/wishlist`** (under the `(storefront)` layout, since it reads as a shopping page, not an account-settings page). The Account dashboard's sidebar "Wishlist" link points to this same `/wishlist` route rather than a separate nested page — `(account)/account/wishlist/` is dropped from the build list for this milestone.

## Wishlist toggle (heart icon) — used on `ProductCard` and the PDP

- Optimistic UI: the heart fills/empties immediately on click; the server action fires in the background. If the action fails, the icon reverts and a toast explains the failure — the customer never has to wait to see the result of a click.
- Toast confirmation on success: "Added to wishlist" / "Removed from wishlist" (brief, dismissible, non-blocking — matches the shared UI toast pattern already established with `sonner`).
- Rapid double-clicks are debounced so a fast double-tap doesn't fire two conflicting toggle requests.
- The header's wishlist icon badge (count) updates immediately alongside the optimistic heart state.

## Wishlist Page (`/wishlist`)

- Grid layout reusing `ProductCard` (from `specs/06`) with two differences from the standard listing card:
  - A filled heart (always shown as "in wishlist," clicking removes — no separate delete icon needed).
  - An "Add to Cart" action per item, using the product's default/first-available variant. If that default variant is out of stock, the button is disabled with the same `StockBadge` treatment used on the PDP ("Out of Stock").
- **Bulk action:** "Add All to Cart" — adds every in-stock item's default variant to the cart in one action, skips out-of-stock items, and shows a single summary toast (e.g. "3 items added, 1 out of stock and skipped") rather than one toast per item.
- **Sort:** date added (newest first) — no other sort options needed for a wishlist-sized list.
- **Empty state:** shared `EmptyState` component — "Your wishlist is empty," with a CTA back to `/products`. This is a genuine user-driven empty state (same treatment as the products/search empty states, not the homepage's "hide the section" pattern).

## What's intentionally out of scope for v1
- Guest wishlist / merge-on-login (see above).
- Wishlist sharing (a public shareable link to someone's wishlist) — a plausible future feature, not required now.
- Price-drop or back-in-stock notifications for wishlisted items — would require a notification/email trigger system; noted as a natural future extension of `emails/` once this milestone exists, not built now.

## Files this milestone touches (for Claude Code's reference)
- `app/(storefront)/wishlist/page.tsx` (the single canonical page)
- `features/wishlist/components/`: `WishlistGrid`, `WishlistItem` (or reuse `ProductCard` with a wishlist-specific prop), `AddAllToCartButton`
- `features/wishlist/hooks/useWishlist.ts` — optimistic toggle state, likely backed by a small Context so the header badge and any `ProductCard` heart icon on the page stay in sync without prop-drilling
- `actions/wishlist.actions.ts`: `toggleWishlist(productId)`, `getWishlist()`, `addAllWishlistToCart()`
- Update to `components/layout/Header.tsx` — wishlist badge count now reads from the same `useWishlist` state
- Update to the Account dashboard sidebar — "Wishlist" link points to `/wishlist`, no separate account-nested page built
