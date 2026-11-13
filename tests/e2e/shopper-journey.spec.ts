import { test, expect } from "@playwright/test";
import { createAccountFromCheckoutGate } from "./helpers/account";

/**
 * The whole path a first-time shopper takes, end to end: browse a category, open a product, add it
 * as a guest, sign up at the checkout gate, verify, sign in, and check the cart survived; place a
 * COD order; then follow "Track this order" even after the short-lived session cookie has lapsed.
 * Step timings are printed so a slow step shows up in the test output.
 */
test("a guest shopper keeps their cart through sign-up and can track the order afterwards", async ({ page }) => {
  const timings: string[] = [];
  async function timed<T>(label: string, step: () => Promise<T>): Promise<T> {
    const started = Date.now();
    const result = await step();
    timings.push(`${label}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
    return result;
  }

  await timed("category page", async () => {
    await page.goto("/shop/categories/jhumkas");
    await expect(page.getByRole("heading", { name: "Jhumkas", exact: true })).toBeVisible();
  });

  await timed("product page", async () => {
    await page.getByRole("link", { name: /Classic Gold Jhumkas/ }).first().click();
    await expect(page).toHaveURL(/\/products\/classic-gold-jhumkas/);
    await expect(page.getByRole("button", { name: "Add to Cart" })).toBeVisible();
  });

  await timed("add to cart", async () => {
    await page.getByRole("button", { name: "Add to Cart" }).click();
    await expect(page.getByRole("button", { name: "Sign in to Checkout" })).toBeVisible({ timeout: 45_000 });
  });

  const email = await timed("sign up, verify and sign in", () =>
    createAccountFromCheckoutGate(page, { name: "E2E Journey Customer", emailPrefix: "e2e-journey" })
  );

  // The item added as a guest must still be in the cart after signing in.
  await expect(page.getByText(/Classic Gold Jhumkas/).first()).toBeVisible();

  await page.getByLabel("Full name").first().fill("E2E Journey Customer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").first().fill("03001234567");
  await page.getByLabel("Full name").nth(1).fill("E2E Journey Customer");
  await page.getByLabel("Phone").nth(1).fill("03001234567");
  await page.getByLabel("Address line 1").fill("House 1, Street 1, Test Town");
  await page.getByLabel("City").fill("Lahore");

  await timed("place order", async () => {
    await page.getByRole("button", { name: "Place Order" }).click();
    await expect(page).toHaveURL(/\/checkout\/confirmation\//, { timeout: 45_000 });
    await expect(page.getByText("Your order has been placed!")).toBeVisible();
  });

  // Lapse the 5-minute session cache cookie, as happens when someone takes a while: they are still
  // signed in (the session cookie lasts 30 days) and must not be sent back to the sign-in page.
  await page.context().clearCookies({ name: "better-auth.session_data" });

  await timed("track order", async () => {
    await page.getByRole("link", { name: "Track this order" }).click();
    await expect(page).toHaveURL(/\/account\/orders\/[0-9a-f-]+$/, { timeout: 45_000 });
    await expect(page.getByText(/^LL-\d{4}-\d{5}$/).first()).toBeVisible();
  });

  // Customers can't cancel by themselves; they are pointed to support instead.
  await expect(page.getByRole("button", { name: /cancel order/i })).toHaveCount(0);
  await expect(page.getByText("Need to cancel or change this order?")).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact support" })).toBeVisible();

  console.log(`\n  Journey timings -> ${timings.join(" | ")}\n`);
});
