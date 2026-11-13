import { expect, type Page } from "@playwright/test";

/**
 * Ordering requires an account, so every checkout test starts by following
 * the real path a guest takes: click "Sign in to Checkout" in the open mini
 * cart -> bounced to login -> "Create one" -> register -> sent back to
 * verify the emailed link (captured by the test-mode email sink) -> sign in
 * -> /checkout with the cart intact. Returns the new account's email.
 */
export async function createAccountFromCheckoutGate(
  page: Page,
  { name, emailPrefix }: { name: string; emailPrefix: string }
) {
  await page.getByRole("button", { name: "Sign in to Checkout" }).click();
  await expect(page).toHaveURL(/\/shop\/login\?redirect=%2Fshop%2Fcheckout/, { timeout: 45_000 });
  await expect(page.getByText(/You need an account to place an order/)).toBeVisible();

  await page.getByRole("link", { name: "Create one" }).click();
  await expect(page).toHaveURL(/\/shop\/register\?redirect=%2Fshop%2Fcheckout/);

  const email = `${emailPrefix}-${Date.now()}@example.com`;
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("TestPassword1");
  await page.getByLabel("Confirm password").fill("TestPassword1");
  await page.getByRole("button", { name: "Create account" }).click();

  // New accounts can't sign in until the emailed link is opened.
  await expect(page).toHaveURL(/\/verify-email\?pending=1/, { timeout: 45_000 });
  const origin = new URL(page.url()).origin;
  const captured = await (await page.request.get(`${origin}/api/test/last-email`)).json();
  expect(captured.to).toBe(email);
  const verifyUrl = (captured.html.match(/href="([^"]+)"/)[1] as string).replace(/&amp;/g, "&");
  await page.goto(verifyUrl);
  await expect(page.getByText("Email verified")).toBeVisible({ timeout: 45_000 });

  await page.goto("/shop/login?redirect=%2Fshop%2Fcheckout");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("TestPassword1");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/checkout$/, { timeout: 45_000 });
  return email;
}
