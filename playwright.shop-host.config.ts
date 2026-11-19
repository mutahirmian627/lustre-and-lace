import { defineConfig, devices } from "@playwright/test";

/**
 * The demo store on its own address (adornments.aperionie.com in production), tested the way production runs it: SHOP_ORIGIN is
 * set, so the store answers on a host of its own. Chromium sends every *.localhost name to this computer, so
 * adornments.localhost is the store's address and plain localhost is the main one. A separate configuration (and build folder)
 * because the setting changes how the whole app routes; the normal suite (playwright.config.ts) runs without it.
 *
 *   npx playwright test -c playwright.shop-host.config.ts
 */
const PORT = 3006;
const MAIN = `http://localhost:${PORT}`;
const SHOP = `http://adornments.localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e-shop-host",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 90_000,
  use: {
    baseURL: SHOP,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // -H 0.0.0.0: a self-hosted Next server turns any redirect back to its own address (localhost) into a relative one, which on
    // two addresses would send people round in circles; bound this way it keeps full addresses, as Vercel does.
    command: `npx next build && npx next start -p ${PORT} -H 0.0.0.0`,
    // Readiness is checked on the main address (Node itself does not resolve *.localhost names).
    url: MAIN,
    reuseExistingServer: false,
    timeout: 900_000,
    env: {
      EMAIL_TEST_MODE: "true",
      NEXT_DIST_DIR: ".next-e2e-shop",
      BETTER_AUTH_URL: MAIN,
      NEXT_PUBLIC_APP_URL: MAIN,
      SHOP_ORIGIN: SHOP,
    },
  },
});
