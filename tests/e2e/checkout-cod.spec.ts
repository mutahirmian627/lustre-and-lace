import { test, expect } from "@playwright/test";
import { createAccountFromCheckoutGate } from "./helpers/account";

/**
 * Shopper browses -> adds to cart -> creates an account at the checkout
 * gate -> checks out with COD -> lands on confirmation with the correct order reference and COD messaging
 * (specs/16). Runs against the real dev database (see playwright.config.ts)
 * — the seed catalog's "Pearl Drop Earrings" is assumed present.
 */
test("a new account can complete a COD checkout", async ({ page }) => {
  await page.goto("/shop/products/pearl-drop-earrings");
  await page.getByRole("button", { name: "Add to Cart" }).click();

  // The mini cart drawer opens once the add-to-cart Server Action actually
  // resolves — a Neon round trip here has been observed taking several
  // seconds, so this click's built-in auto-wait is the real sync point
  // (unlike waiting for the PDP heading, which is visible before the click
  // and proves nothing about the mutation completing).
  const email = await createAccountFromCheckoutGate(page, {
    name: "E2E Test Customer",
    emailPrefix: "e2e-cod",
  });

  await page.getByLabel("Full name").first().fill("E2E Test Customer");
  await page.getByLabel("Email").fill(email);
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
