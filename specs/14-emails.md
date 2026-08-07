# Emails Specification

## Setup

- **Resend** as the sending provider (per `specs/00`), wrapped in `lib/resend.ts` — a thin client instance, `RESEND_API_KEY` from env, a single `FROM_EMAIL` constant (e.g. `hello@lustreandlace.com` — **placeholder domain, must be a verified sending domain in Resend before launch**, same "must be filled in before launch" caveat as the payment numbers in `specs/10`).
- **React Email** for template authoring — components render to HTML (with an automatic plain-text fallback) rather than hand-written HTML strings, which is both more maintainable and less error-prone across email clients.
- All emails in this project are **transactional**, not marketing (there's no newsletter feature — cut entirely in `specs/05`). **Decision: no unsubscribe link is needed** on any of these templates — transactional emails (verification, password reset, order updates) are exempt from unsubscribe requirements under typical anti-spam regulations, unlike marketing email. Worth stating plainly so no one adds one out of habit.

## Branding in email — an important constraint, not a naive copy-paste of the web design

Email clients (Outlook in particular, but Gmail too in some contexts) have unreliable support for custom `@font-face` fonts. **Decision: emails use web-safe font fallbacks, not the actual Playfair Display/Inter files used on the website.**
- Headings: a serif fallback stack (`Georgia, 'Times New Roman', serif`) standing in for Playfair Display's *feel* without depending on the font actually loading.
- Body text: a system sans-serif stack (`-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`) standing in for Inter.
- Brand colors (Rose Gold CTA buttons, Cream backgrounds, Charcoal text) **do** carry over directly — inline hex colors render reliably everywhere, unlike custom fonts.
- This is a deliberate, informed trade-off: matching the exact typography isn't achievable reliably across inboxes, so the templates aim for "recognizably on-brand" rather than "pixel-identical to the website."

## Template inventory

| Template | Trigger | Key content |
|---|---|---|
| `emails/verify-email.tsx` | New user registration (Better Auth, per `specs/03`) | Verification link/button, expires in 24h |
| `emails/reset-password.tsx` | Forgot-password request (Better Auth, per `specs/03`) | Reset link/button, expires in 1h, no-enumeration-safe copy |
| `emails/order-confirmation.tsx` | Order placed (`placeOrder` action, per `specs/10`) | Order reference, item list, total, payment-method-specific next steps (COD note, or EasyPaisa/JazzCash numbers + WhatsApp link — mirrors the confirmation page) |
| `emails/payment-confirmed.tsx` | Admin clicks "Confirm Payment" on a manual-transfer order (per `specs/13`) | Order reference, confirmation that payment was received, expected next step (processing/shipping) |
| `emails/order-shipped.tsx` | Admin advances order status to `shipped` (per `specs/13`) | Order reference, items, a note that no live courier tracking is available (per the v1 simplification in `specs/13` — sets expectations rather than implying tracking that doesn't exist) |
| `emails/order-cancelled.tsx` | Any cancellation path — customer self-cancel, admin cancel, or the auto-cancel job (all per `specs/11`) | Order reference, cancellation reason context where available (e.g. "unpaid after 48 hours" for auto-cancel vs. a generic cancellation note for manual), restock/refund note if payment had been collected |
| `emails/account-deletion-confirm.tsx` | "Delete My Account" request (per `specs/12`) | Confirmation link to actually execute the deletion, clear warning that this is permanent |

**Decision: no "Order Delivered" email.** For COD orders especially, the customer is physically present for delivery and already knows — an email confirming something they just experienced firsthand adds little value. Skipped deliberately, not an oversight.

## Shared structure across all templates

- A common `EmailLayout` wrapper component (logo/wordmark header, Cream background block, Charcoal footer text with a plain-text business contact line) — every template composes this rather than rebuilding the shell each time.
- Every template that includes a primary action (verify, reset, confirm deletion) uses the same Rose Gold button component for visual consistency.
- Order-related templates share a common `OrderItemsSummary` sub-component (thumbnail, name, variant, qty, price) so the line-item presentation doesn't drift between confirmation/shipped/cancelled emails.

## Development & preview

- React Email's local dev preview server (`email dev` / equivalent script) is used during development to view templates in-browser without actually sending anything — added as an npm script (e.g. `pnpm email:dev`) rather than relying solely on sending real test emails to iterate on layout.
- **Not pursued for v1:** cross-client visual regression testing (Litmus, Email on Acid). React Email's own components are already built to be cross-client-safe by default, which is treated as sufficient here rather than adding a paid testing service for a small template set.

## Files this milestone touches (for Claude Code's reference)
- `lib/resend.ts`
- `emails/EmailLayout.tsx` (shared wrapper) and its sub-components (`OrderItemsSummary`, `EmailButton`)
- `emails/verify-email.tsx`, `emails/reset-password.tsx` (already flagged as dependencies since `specs/03`, actually built here)
- `emails/order-confirmation.tsx`, `emails/payment-confirmed.tsx`, `emails/order-shipped.tsx`, `emails/order-cancelled.tsx`
- `emails/account-deletion-confirm.tsx`
- Wiring into the relevant Server Actions: `actions/checkout.actions.ts` (`placeOrder`), `actions/admin/orders.actions.ts` (`confirmPayment`, `advanceOrderStatus`), `actions/orders.actions.ts` (`cancelOrder`), `actions/account.actions.ts` (`requestAccountDeletion`), plus the auto-cancel cron route from `specs/11`
