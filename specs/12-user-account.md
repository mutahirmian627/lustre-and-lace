# User Account Specification

This milestone completes the `(account)` route group. Order history (`/account/orders`) and Wishlist (linking out to the canonical `/wishlist`) are already fully specified in `specs/11` and `specs/08` respectively — this spec covers what's left: the account shell/sidebar, Overview, Addresses, and Settings.

## Account layout & sidebar

- `(account)/layout.tsx` enforces the session guard (per `specs/03`'s middleware rules) and renders a persistent sidebar: **Overview, Orders, Wishlist, Addresses, Settings, Log Out**.
- Wishlist's sidebar link points to `/wishlist` directly (not a nested page) — consistent with the decision already made in `specs/08`.
- Mobile: sidebar collapses into a horizontal scrollable tab bar or a dropdown at the top of the account area, rather than a hidden hamburger — account navigation is used frequently enough within a session that it shouldn't need an extra tap to reveal.
- Log Out calls the Better Auth client's `signOut()` directly (same pattern established in `specs/03` — no custom server action needed for a standard auth action).

## Account Overview (`/account`)

- Welcome message with the customer's name.
- **Email verification banner** if `emailVerified = false` — persistent-but-dismissible-per-session, with a resend-verification action, exactly per the policy already set in `specs/03` (not re-decided here, just surfaced in the right place).
- Quick stats: total order count, wishlist item count.
- "Recent Orders" preview — last 2–3 orders with status badges, linking out to the full `/account/orders` list (reuses `OrderCard` from `specs/11`, not a new component).
- Quick links to Addresses and Settings.

## Addresses (`/account/addresses`)

- Grid/list of saved `addresses` rows: label, name, phone, formatted full address, a "Default" badge on whichever one has `isDefault = true`.
- **Add New Address** — dialog (shadcn `Dialog`) rather than a full page navigation, since it's a short form and shouldn't interrupt the addresses list context.
- **Edit** / **Delete** per address card.
  - Deleting a saved address is always safe with respect to order history — `orders.shippingAddress` is an immutable snapshot (per `specs/02`/`specs/10`), so past orders are entirely unaffected by deleting the saved address record they originated from.
- **Set as Default** — setting one address as default must atomically unset any previous default in the same transaction (only one `isDefault = true` row per user at a time; enforced in the server action, not just left to UI discipline).
- **Empty state:** shared `EmptyState` — "No saved addresses yet," CTA to add one.
- The Checkout milestone's `SavedAddressSelector` (from `specs/10`) reads from this same table — this page is where those rows actually get created/managed.

## Settings (`/account/settings`)

### Profile
- **Name and phone are editable.** **Email is not editable through this UI in v1** — email is tied to login identity and verification state, and building a proper re-verify-new-email flow (Better Auth supports this via plugins, but it's added complexity) isn't worth it for launch. A customer needing to change their email contacts support directly. This is a deliberate v1 scope cut, not an oversight — flag if you'd rather support it now.

### Change Password
- Current password + new password + confirm, calling Better Auth's client-side `changePassword` method directly (same "don't wrap standard auth flows in custom server actions" principle from `specs/03`).
- Standard Zod validation matching the same password rule already defined for registration (min 8 chars, at least one number).

### Delete Account (danger zone)
- **Decision: this is a two-step, email-confirmed deletion, not an immediate one-click hard delete.** Given how irreversible account deletion is, requiring only a button click (even with a "type DELETE to confirm" dialog) isn't enough friction for something this permanent, especially if a session were ever compromised. Flow:
  1. Customer clicks "Delete My Account," confirms via a typed-confirmation dialog (type "DELETE").
  2. A confirmation email is sent (reusing the same verification-token mechanism already built for email verification/password reset in `specs/03` — not a new token system) with a "Confirm Account Deletion" link.
  3. Clicking that link (while still logged in — the confirmation page lives under the `(account)` layout, so it re-checks the session **and** the token together) performs the actual deletion.
  4. **What happens on deletion:** the `user` row is hard-deleted. `sessions`, `accounts`, `wishlists`, `addresses`, `cartItems`/`carts`, and `reviews` all cascade-delete per their existing `onDelete: "cascade"` foreign keys (per `specs/02`) — these are all personal records, safe to remove entirely. `orders.userId` uses `onDelete: "set null"`, so **order history survives** deletion (as anonymized/orphaned orders, matching the same design that already supports guest checkout) — a customer's past purchases don't just vanish from the business's records because they deleted their account.
- **Deferred to a later enhancement, not built now:** a 30-day soft-delete/grace-period before the hard delete actually executes. v1 goes straight to permanent deletion once the email-confirmation link is clicked — flag if a grace period feels necessary before launch rather than after.

## Files this milestone touches (for Claude Code's reference)
- `app/(account)/layout.tsx`
- `app/(account)/account/page.tsx` (Overview)
- `app/(account)/account/addresses/page.tsx`
- `app/(account)/account/settings/page.tsx`
- `app/(account)/account/delete-confirm/page.tsx` — **new page, not previously listed in `specs/01`**, handles the email-confirmation-link step of account deletion
- `features/account/components/`: `AccountSidebar`, `AccountOverviewStats`, `AddressCard`, `AddressFormDialog`, `ProfileForm`, `ChangePasswordForm`, `DeleteAccountDialog`
- `actions/account.actions.ts`: `updateProfile`, `addAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`, `requestAccountDeletion`, `confirmAccountDeletion`
- `emails/` — one additional template for the account-deletion confirmation email
