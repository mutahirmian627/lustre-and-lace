# Deployment Specification

## Platform

- **Hosting:** Vercel (per `specs/00`) — automatic preview deployments per pull request, production deploy on merge to `main`.
- **Database:** Neon PostgreSQL (per `specs/00`) — production branch is the real database; the testing branch from `specs/16` is a separate, disposable Neon branch, never the same one production writes to.
- **Domain/DNS:** custom domain pointed at Vercel; Resend requires its own DNS records (SPF/DKIM) on the sending domain to be added separately — this is a prerequisite for the email domain to actually be "verified" as referenced in `specs/14`, not something Vercel's DNS setup handles automatically.

## Environment variables — complete checklist

Consolidated from every prior milestone, so nothing is discovered missing at deploy time:

| Variable | Purpose | Source spec |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string | `specs/02` |
| `BETTER_AUTH_SECRET` | Session/token signing secret for Better Auth | `specs/03` |
| `BETTER_AUTH_URL` (or equivalent base URL Better Auth needs) | Auth callback/base URL | `specs/03` |
| `RESEND_API_KEY` | Transactional email sending | `specs/14` |
| `CLOUDINARY_CLOUD_NAME` | Image hosting/optimization | `specs/00` |
| `CLOUDINARY_API_KEY` | Image hosting/optimization | `specs/00` |
| `CLOUDINARY_API_SECRET` | Image hosting/optimization | `specs/00` |
| `CRON_SECRET` | Shared secret verifying Vercel Cron requests to the auto-cancel route | `specs/11` |
| `NEXT_PUBLIC_APP_URL` | Absolute base URL used when building links inside emails (verification, order confirmation) and the WhatsApp `wa.me` deep link | `specs/10`, `specs/14` |

**Not env variables — deliberately moved into the database instead:** EasyPaisa number, JazzCash number, WhatsApp business number, flat shipping rate, and the auto-cancel threshold hours all live in the `platformSettings` table (per `specs/13`), editable from the Admin Settings page rather than requiring a redeploy to change. **This means there's a one-time post-deploy step** (see checklist below) to seed these with real values — they don't come from `.env` at all.

## Database migrations on deploy

- `drizzle-kit push` (or `migrate`, depending on final migration workflow preference) runs against the production Neon branch as part of the deploy pipeline — **before** the new application code that depends on the updated schema goes live, not after, to avoid a window where running code expects columns/tables that don't exist yet.
- Neon's automatic backups / point-in-time restore are relied on as the safety net for migrations — no separate custom backup tooling is being built for this project.

## Vercel Cron

- The auto-cancel-unpaid-orders route (`app/api/cron/auto-cancel-unpaid-orders/route.ts`, per `specs/11`) is registered in `vercel.json` as a Cron Job (e.g. running hourly), calling the route with the `CRON_SECRET` header Vercel Cron supplies automatically — the route itself validates that header matches before doing anything, so it can't be triggered by an arbitrary external request.

## Monitoring

- **Decision: rely on Vercel's built-in observability (logs, Web Analytics, Core Web Vitals reporting) for v1** rather than adding a dedicated error-tracking service (e.g. Sentry). This is consistent with the project's general "avoid overengineering" instinct — a dedicated error-tracking integration is a reasonable fast-follow once real production traffic exists and specific pain points emerge, not a launch requirement.

## Pre-launch / post-deploy checklist

Distinct from the automated CI checks in `specs/16` — these are one-time, mostly manual steps:

1. Verify the sending domain in Resend (DNS records added) — emails will silently fail or land in spam otherwise.
2. **Seed `platformSettings` with real values** — actual EasyPaisa number, actual JazzCash number, actual WhatsApp business number, confirm shipping rate (250 PKR) and auto-cancel threshold (48h) are as intended. This is the resolution of every "placeholder — must be filled in before launch" note left across `specs/10`, `specs/11`, and `specs/13`.
3. Run `db/seed.ts` once against production to create the bootstrap admin account (per `specs/03`) — then immediately log in and change that password.
4. Do one real, manual smoke test of both checkout paths in production (not staging) — place a real COD order and a real manual-transfer order end-to-end, confirm the WhatsApp deep link opens correctly with the right pre-filled message, confirm the order-confirmation email actually arrives.
5. Confirm `robots.ts`/`sitemap.ts` (per `specs/15`) are reachable at their expected URLs and that `/admin`, `/account` are actually excluded from what a crawler would index.
6. Submit the sitemap to Google Search Console and add the real verification meta tag (the placeholder left empty in `specs/15`).

## Files this milestone touches (for Claude Code's reference)
- `vercel.json` (Cron Job registration)
- `.env.example` — every variable from the checklist above, with placeholder values and comments pointing back to the relevant spec
- Deploy pipeline config (GitHub Actions or Vercel's own build settings) wiring the migration step before the app build/deploy step
