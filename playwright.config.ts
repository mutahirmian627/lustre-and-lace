import { defineConfig, devices } from "@playwright/test";

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Runs against a production build on its own port (specs/16), not the
 * manually-managed dev server on 3000 — both so EMAIL_TEST_MODE can be
 * forced on for this process only, and because a long-lived `next dev`
 * instance measurably degrades (Server Actions that normally resolve in a
 * few seconds started taking 45s+ after a couple dozen requests during
 * manual debugging of this suite) in a way a fresh production build does
 * not.
 *
 * Uses the same database as the rest of this project, not a separate Neon
 * test branch — specs/16's stated decision is a dedicated branch, but
 * provisioning one requires Neon account access this environment doesn't
 * have. Flagged here rather than silently deviating from the spec.
 *
 * Server Actions that touch the DB were measured taking 4-13s round trip
 * against this Neon instance (serverless HTTP driver, no connection
 * pooling, several sequential queries per action) — Playwright's 30s
 * default test timeout gets consumed by a single click() in flows that
 * chain a few of these, so it's raised well past the observed variance.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 90_000,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    // A from-scratch build alone was measured taking 25s-75s depending on
    // cache warmth, before `next start` even begins — 180s cut this close.
    timeout: 300_000,
    env: {
      EMAIL_TEST_MODE: "true",
      NEXT_DIST_DIR: ".next-e2e",
      // .env.local hardcodes both of these to port 3000 — left as-is here,
      // the auth client's cross-origin fetch to :3000 gets silently
      // blocked by CORS and every signIn/signUp call hangs forever.
      BETTER_AUTH_URL: BASE_URL,
      NEXT_PUBLIC_APP_URL: BASE_URL,
    },
  },
});
