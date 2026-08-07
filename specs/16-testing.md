# Testing Specification

## Framework choices (not previously named in `specs/00`)

- **Unit / component tests:** Vitest + React Testing Library — Vitest is fast, ESM-native, and integrates cleanly with a Next.js 15 + TypeScript + Tailwind v4 stack; React Testing Library for anything rendering a component tree.
- **End-to-end tests:** Playwright — multi-browser, good Next.js support, and capable of driving real flows (checkout, auth) against a running instance.
- Both are dev dependencies only; neither ships to production.

## Pragmatic scope decision

Full exhaustive coverage of every component isn't a realistic or valuable target before launch. **Decision: prioritize by financial/data risk, not by file count.** Testing effort concentrates on:

1. **Business logic that touches money or stock** (unit tests — fast, no browser needed):
   - Discount calculation (`percentage` capped by `maxDiscountAmount`, `fixed` floored at zero) — per `specs/09`.
   - Coupon validation rules (active window, `minOrderAmount`, `usageLimit`) — per `specs/09`/`specs/10`.
   - Stock validation/capping logic used in cart and checkout — per `specs/09`/`specs/10`.
   - Guest-cart-merge-on-login logic (sum overlapping quantities, cap at stock) — per `specs/03`.
   - Order-reference formatting function (the sequence itself lives in Postgres and isn't unit-testable in isolation, but the formatting/padding logic around it is) — per `specs/10`.
   - Cancellation side effects (restock math, coupon-usage reversal) — per `specs/11`.

2. **Critical end-to-end revenue paths** (Playwright, run against a real running app + test database):
   - Guest browses → adds to cart → checks out with **COD** → lands on confirmation page with correct order reference and COD messaging.
   - Guest browses → adds to cart → checks out with **manual transfer** → confirmation page shows the correct EasyPaisa/JazzCash numbers and a working WhatsApp deep link.
   - Register → verify email (via a test-mode email capture, not a real inbox — see below) → log in.
   - Admin logs in → opens an "Awaiting Payment Confirmation" order → clicks Confirm Payment → order's payment status updates correctly.
   - A logged-in customer's guest cart correctly merges into their account cart after login (the one piece of cross-cutting logic most likely to have a subtle bug, given it touches two carts at once).

3. **Explicitly not a priority for v1:**
   - Pixel-perfect visual regression testing.
   - Exhaustive unit tests for purely presentational components (a `Badge` or `PriceDisplay` rendering correctly is low-risk and easy to catch by eye during development).
   - Load/performance testing — Vercel's own monitoring and Core Web Vitals reporting (per `specs/15`) are treated as the ongoing signal here, not a pre-launch test suite.

## Test environment

- **Decision: a dedicated Neon database branch for testing** (Neon's branching feature creates an isolated, disposable copy of the schema) rather than mocking Drizzle/Postgres — running real queries against a real (if disposable) Postgres instance catches issues that mocking would hide, and Neon branching makes this cheap and fast to reset between runs.
- Email sending is **not** hit for real in tests — Resend's test mode / a mocked `lib/resend.ts` in the test environment captures what *would* have been sent (recipient, subject, key content) without actually delivering, so the email-verification E2E flow above can assert on content without needing a real inbox.

## CI

- GitHub Actions workflow (or equivalent) running on every push/PR: typecheck (`tsc --noEmit`), lint, unit tests, production build, then the Playwright E2E suite against a preview deployment or a locally-started instance pointed at the Neon test branch.
- A failing build or failing critical-path E2E test blocks merge; failing a non-critical unit test is a signal to fix, not necessarily a hard block, depending on team judgment at the time.

## Accessibility testing

- `axe-core` (via `@axe-core/playwright` or a Vitest-integrated variant) run against key pages (homepage, PDP, checkout, cart) as part of the same test suite — catches obvious contrast/ARIA/label issues automatically, complementing (not replacing) the manual accessibility requirements already specified per-milestone (`specs/04`, `specs/06`, etc.).

## Files this milestone touches (for Claude Code's reference)
- `vitest.config.ts`, `playwright.config.ts`
- `tests/unit/` — mirrors the business-logic list above (e.g. `discount.test.ts`, `stock-validation.test.ts`, `cart-merge.test.ts`, `order-reference.test.ts`, `cancellation.test.ts`)
- `tests/e2e/` — `checkout-cod.spec.ts`, `checkout-manual-transfer.spec.ts`, `auth-verify-flow.spec.ts`, `admin-confirm-payment.spec.ts`, `guest-cart-merge.spec.ts`
- `lib/resend.test-mode.ts` (or an equivalent mock wired in via environment/config for the test environment)
- `.github/workflows/ci.yml`
