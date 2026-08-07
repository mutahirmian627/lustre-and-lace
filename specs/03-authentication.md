# Authentication Specification (Better Auth)

## Library & core config

- **Library:** Better Auth (latest v1.x), using its **Drizzle adapter**, pointed at the tables in `db/schema/users.ts` (`user`, `session`, `account`, `verification`).
- **Session strategy:** Database sessions (Better Auth's default) — a `token` stored in `session` and referenced by an httpOnly, `secure` (in production), `sameSite=lax` cookie. **Not JWT**, per project rule.
- **Server config file:** `lib/auth.ts` — instantiates Better Auth with:
  - `database`: the Drizzle adapter + `db` client from `db/index.ts`.
  - `emailAndPassword`: `{ enabled: true, requireEmailVerification: false }` at the auth level (see verification policy below for why it's `false` here but still enforced at the feature level).
  - `session`: expiry ~30 days, sliding renewal on activity (`updateAge`), so active customers aren't logged out mid-browsing.
  - `emailVerification`: token expiry ~24 hours; `sendVerificationEmail` wired to the Resend service (`lib/resend.ts`) using the `emails/verify-email.tsx` template.
  - `passwordReset` (via Better Auth's built-in flow or plugin): token expiry ~1 hour; `sendResetPassword` wired to Resend using `emails/reset-password.tsx`.
  - `rateLimit`: enabled on auth endpoints (login, register, forgot-password) using Better Auth's built-in limiter — prevents brute-force and password-reset spam.
  - `socialProviders`: left empty/commented for now. The `account` table already supports OAuth generically, so adding Google/Facebook later requires zero schema changes — just config.
- **Client config file:** `lib/auth-client.ts` — `createAuthClient()` from Better Auth's React client, pointed at the app's base URL. Exposes `useSession()`, `signIn`, `signUp`, `signOut`, `forgetPassword`, `resetPassword` for use directly in client components.
- **Route handler:** `app/api/auth/[...all]/route.ts` — thin file that exports Better Auth's Next.js handler (`GET`/`POST`). No custom logic lives here.

## Why no custom server actions for standard auth flows

Login, register, forgot-password, and reset-password call the Better Auth **client SDK** directly from client components (`authClient.signIn.email(...)`, etc.), which talks to the `/api/auth/[...all]` route. We deliberately do **not** wrap these in custom Server Actions — Better Auth's own implementation is already tested for these flows (hashing, token generation, rate limiting), and duplicating that logic in `actions/auth.actions.ts` would be redundant surface area to maintain and secure. `actions/auth.actions.ts` is reserved for auth-*adjacent* business logic only (e.g. "on successful login, merge guest cart into user cart" — see below), not the auth flows themselves.

## Roles & authorization

- Two roles: `customer` (default on signup) and `admin`.
- **Public sign-up always creates a `customer`.** There is no UI path to self-assign `admin`. Admin accounts are created via `db/seed.ts` (one bootstrap admin) or a one-off script/SQL run by the project owner. This is a hard security rule, not a shortcut to revisit later.
- **`middleware.ts`** is the single enforcement point:
  - Any request to `/account/*` without a valid session → redirect to `/login?redirect=<original-path>`.
  - Any request to `/admin/*` without a valid session, **or** with a session where `role !== "admin"` → redirect to `/login` (unauthenticated) or a `403`/not-found style page (authenticated but wrong role — avoid leaking that `/admin` exists as a concept to regular customers via an inviting login redirect).
  - Storefront and auth route groups remain public.

## Email verification policy

- Verification is **not a hard gate on checkout** — guest checkout exists specifically so an unverified (or entirely account-less) customer can still purchase. Blocking purchases on verification would contradict the guest-checkout requirement.
- Verification **is** required to access `/account/*` features long-term (order history tied to an account, saved addresses, wishlist persistence). A logged-in-but-unverified user sees a persistent, dismissible-but-recurring banner ("Please verify your email") rather than a hard block, with a resend-verification action.
- Rationale: this keeps the funnel friction-free (matches "encourage browsing," "comfortable," "confident" brand goals) while still protecting account-tied features from throwaway emails.

## Password & validation rules (Zod, enforced client + server)

| Field | Rule |
|---|---|
| Name | min 2 characters |
| Email | valid format, normalized to lowercase before storage/lookup |
| Password | min 8 characters, at least one number |
| Confirm password | must match `password` |
| Phone (optional at signup) | Pakistani format tolerant (`+92...` or `03...`), validated more strictly at checkout/address time |

## Security requirements (must be implemented, not optional polish)

- **No user enumeration on forgot-password:** the response message is identical whether or not the email exists ("If an account exists for this email, a reset link has been sent.").
- **Verification/reset tokens are single-use and time-boxed** (24h / 1h respectively) — enforced by Better Auth's token expiry, not custom logic.
- **CSRF:** Better Auth's same-site cookie + origin validation on its own endpoints; no additional custom CSRF token needed for auth specifically.
- Session cookie must be `httpOnly`, `secure` in production, `sameSite=lax` — confirm Better Auth's defaults are not weakened by any custom config.

## Cross-cutting behavior: guest cart merge on login

This is an auth-triggered piece of business logic that must be specified even though it lives in `actions/cart.actions.ts`, not the auth module itself:

- When a guest (identified by the `carts.guestToken` cookie) logs in or registers, their guest cart's `cartItems` must be **merged into** — not replace, and not be discarded by — their existing user cart (if one already exists from a previous session).
- Merge rule: for overlapping `(productId, variantId)` pairs, quantities are **summed**, capped at available `stockQuantity`. Non-overlapping items are simply added.
- After a successful merge, the guest cart row and its `guestToken` cookie are cleared.
- This hook fires from the `onSuccess` callback of the Better Auth client's `signIn`/`signUp` calls on the client side, calling a dedicated server action (e.g. `mergeGuestCart(guestToken)`).

## Files this milestone touches (for Claude Code's reference — described, not written here)

- `lib/auth.ts`, `lib/auth-client.ts`
- `app/api/auth/[...all]/route.ts`
- `middleware.ts`
- `features/auth/components/`: `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `VerifyEmailBanner`
- `features/auth/types.ts`: any auth-related types not already inferred from Better Auth
- `emails/verify-email.tsx`, `emails/reset-password.tsx` — React Email templates, Lustre & Lace branded (Playfair heading, rose-gold CTA button, cream background)
- `db/seed.ts` — must create exactly one bootstrap admin user
- `actions/cart.actions.ts` — `mergeGuestCart` (referenced above, implemented fully in the cart/checkout milestone)

## Open decisions for the project owner (flag before Claude Code generates this)

1. Exact session length (proposed: 30 days sliding) — confirm or adjust.
2. Exact copy/tone for verification and reset emails — can be drafted in the emails milestone using the brand voice (warm, sophisticated, confident).
3. Whether an unverified user should be blocked from *writing* a review (proposed: yes, require verified email to submit a review, since reviews are public-facing trust signals) — confirm.
