# Lustre & Lace

*"Where Every Sparkle Tells Your Story."*

An e-commerce storefront and admin platform for an artificial jewellery boutique — products, search, wishlist, cart, checkout (Cash on Delivery + manual bank transfer), order tracking, user accounts, and a full admin dashboard (products, categories, orders, customers, inventory, coupons, reviews, analytics, settings).

Full product/engineering specs live in [`specs/`](specs/), numbered in build order (`00` brand & tech stack → `17` deployment).

## Tech stack

- **Framework:** Next.js 15 (App Router), TypeScript (strict)
- **UI:** React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, Lucide React
- **Database:** PostgreSQL (Neon) via Drizzle ORM
- **Auth:** Better Auth (session-based)
- **Forms/validation:** React Hook Form + Zod
- **Images:** Cloudinary
- **Email:** Resend + React Email
- **Package manager:** pnpm

See [`specs/00-brand-and-tech-stack.md`](specs/00-brand-and-tech-stack.md) for the full rationale and explicitly-excluded choices.

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `BETTER_AUTH_SECRET` | Yes | Session/token signing secret — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Yes | Base URL Better Auth uses for callbacks (`http://localhost:3000` in dev) |
| `RESEND_API_KEY` | Yes | Transactional email: sign-up verification, password reset, order emails. New accounts can't sign in until they click the emailed link, so this must be a real key |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | No | Send email through a regular mailbox (e.g. Gmail + app password) when you have no domain for Resend. If `SMTP_HOST` is set it replaces Resend |
| `FROM_EMAIL` | Yes | Sending address — must be on a domain verified in Resend before production use. For local testing use `Lustre & Lace <onboarding@resend.dev>`, which only delivers to the email you registered with Resend |
| `CLOUDINARY_CLOUD_NAME` | Yes | Product image hosting/optimization |
| `CLOUDINARY_API_KEY` | Yes | Product image hosting/optimization |
| `CLOUDINARY_API_SECRET` | Yes | Product image hosting/optimization |
| `CRON_SECRET` | Yes | Verifies Vercel Cron requests to the auto-cancel-unpaid-orders route — generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Yes | Absolute base URL used in emails and the WhatsApp `wa.me` deep link |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes (for seeding) | Bootstrap admin account created by `db:seed` — change the password after first login |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Yes (for seeding) | The single super admin (12+ character password). Only this account can promote or remove admins, in `/super-admin`. A database trigger prevents a second one |

**Not env variables:** the EasyPaisa number, JazzCash number, WhatsApp business number, shipping rate, and auto-cancel threshold are stored in the `platformSettings` table and edited from the Admin Settings page, not `.env`. Seed real values before launch (see [`specs/17-deployment.md`](specs/17-deployment.md)).

### 3. Set up the database

```bash
pnpm db:migrate      # apply migrations
pnpm db:seed         # create the bootstrap admin account
pnpm db:seed:dev     # optional: sample products/categories for local dev
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build / start |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Drizzle Studio (DB browser) |
| `pnpm db:seed` | Seed the bootstrap admin account |
| `pnpm db:seed:dev` | Seed sample dev data |
| `pnpm email:dev` | Preview React Email templates |
| `pnpm test:unit` / `pnpm test:unit:watch` | Vitest unit tests |
| `pnpm test:e2e` | Playwright end-to-end tests |

## Testing

- **Unit tests:** Vitest (`test:unit`)
- **E2E tests:** Playwright (`test:e2e`), including accessibility checks via `@axe-core/playwright`
- CI runs lint, typecheck, unit, and e2e on every PR — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Deployment

Deployed on Vercel with a Neon Postgres production branch. The auto-cancel-unpaid-orders route is registered as an hourly Vercel Cron job in [`vercel.json`](vercel.json).

Before going live, complete the pre-launch checklist in [`specs/17-deployment.md`](specs/17-deployment.md) — verifying the Resend sending domain, seeding `platformSettings` with real values, changing the bootstrap admin password, and a manual smoke test of both checkout paths.
