import { test, expect } from "@playwright/test";
import { createAccountFromCheckoutGate } from "./helpers/account";

/**
 * A new account places a manual-transfer order (lands in "awaiting_confirmation")
 * -> admin logs in, finds it on the default Orders tab, confirms payment ->
 * the order's payment status flips to "Paid" (specs/13, specs/16).
 */
test("admin can confirm a manual-transfer order's payment", async ({ page }) => {
  await page.goto("/products/everyday-stud-earrings");
  await page.getByRole("button", { name: "Add to Cart" }).click();

  // The mini cart drawer opens once the add-to-cart Server Action actually
  // resolves — this click's built-in auto-wait is the real sync point.
  const email = await createAccountFromCheckoutGate(page, {
    name: "E2E Admin Confirm",
    emailPrefix: "e2e-confirm",
  });

  await page.getByLabel("Full name").first().fill("E2E Admin Confirm");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").first().fill("03331234567");
  await page.getByLabel("Full name").nth(1).fill("E2E Admin Confirm");
  await page.getByLabel("Phone").nth(1).fill("03331234567");
  await page.getByLabel("Address line 1").fill("House 3, Street 3, Test Town");
  await page.getByLabel("City").fill("Islamabad");
  await page.getByRole("radio", { name: /Bank Transfer/ }).click();
  await page.getByRole("button", { name: "Place Order" }).click();

  await expect(page).toHaveURL(/\/checkout\/confirmation\//, { timeout: 45_000 });
  const referenceLocator = page.getByText(/^LL-\d{4}-\d{5}$/).first();
  await expect(referenceLocator).toBeVisible();
  const orderReference = (await referenceLocator.textContent())?.trim();
  expect(orderReference).toBeTruthy();

  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@lustreandlace.com");
  await page.getByLabel("Password").fill("change-this-password-1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 45_000 });

  // Default landing tab is "Awaiting Payment Confirmation" (specs/13).
  await page.goto("/admin/orders");
  await page.getByRole("link", { name: orderReference! }).click();

  await expect(page).toHaveURL(/\/admin\/orders\//);
  await page.getByRole("button", { name: "Confirm Payment" }).click();

  await expect(page.getByText("Paid", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Confirm Payment" })).toHaveCount(0);
});
