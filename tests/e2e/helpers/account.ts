import { expect, type Page } from "@playwright/test";

/**
 * Ordering requires an account, so every checkout test starts by following
 * the real path a guest takes: click "Sign in to Checkout" in the open mini
 * cart -> bounced to login -> "Create one" -> register -> sent back to
 * /checkout with the cart intact. Returns the new account's email.
 */
export async function createAccountFromCheckoutGate(
  page: Page,
  { name, emailPrefix }: { name: string; emailPrefix: string }
) {
  await page.getByRole("button", { name: "Sign in to Checkout" }).click();
  await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/, { timeout: 45_000 });
  await expect(page.getByText(/You need an account to place an order/)).toBeVisible();

  await page.getByRole("link", { name: "Create one" }).click();
  await expect(page).toHaveURL(/\/register\?redirect=%2Fcheckout/);

  const email = `${emailPrefix}-${Date.now()}@example.com`;
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("TestPassword1");
  await page.getByLabel("Confirm password").fill("TestPassword1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/checkout$/, { timeout: 45_000 });
  return email;
}
