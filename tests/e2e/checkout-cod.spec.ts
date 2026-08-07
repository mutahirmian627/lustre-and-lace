import { test, expect } from "@playwright/test";

/**
 * Guest browses -> adds to cart -> checks out with COD -> lands on
 * confirmation with the correct order reference and COD messaging
 * (specs/16). Runs against the real dev database (see playwright.config.ts)
 * — the seed catalog's "Pearl Drop Earrings" is assumed present.
 */
test("guest can complete a COD checkout", async ({ page }) => {
  await page.goto("/products/pearl-drop-earrings");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  // Wait for the add to actually land (a Server Action round trip against
  // Neon here has been observed taking several seconds) before navigating
  // straight to checkout — going through the mini cart drawer's own
  // "Checkout" link proved flaky under the full suite's sequential load.
  await expect(page.getByRole("heading", { name: "Pearl Drop Earrings" })).toBeVisible({
    timeout: 45_000,
  });
  await page.goto("/checkout");

  const timestamp = Date.now();
  await page.getByLabel("Full name").first().fill("E2E Test Customer");
  await page.getByLabel("Email").fill(`e2e-cod-${timestamp}@example.com`);
  await page.getByLabel("Phone").first().fill("03001234567");

  await page.getByLabel("Full name").nth(1).fill("E2E Test Customer");
  await page.getByLabel("Phone").nth(1).fill("03001234567");
  await page.getByLabel("Address line 1").fill("House 1, Street 1, Test Town");
  await page.getByLabel("City").fill("Lahore");

  // Cash on Delivery is the default-selected payment method already.
  await page.getByRole("button", { name: "Place Order" }).click();

  await expect(page).toHaveURL(/\/checkout\/confirmation\//, { timeout: 45_000 });
  await expect(page.getByText(/^LL-\d{4}-\d{5}$/)).toBeVisible();
  await expect(page.getByText("Your order has been placed!")).toBeVisible();
  await expect(page.getByText("Pay in cash when it arrives.")).toBeVisible();
});
