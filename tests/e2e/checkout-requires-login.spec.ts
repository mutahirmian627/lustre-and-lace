import { test, expect } from "@playwright/test";

/** Ordering requires an account: a signed-out visitor can't reach checkout or a confirmation page. */
test("checkout redirects a signed-out visitor to login", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fcheckout/);
  await expect(page.getByText(/You need an account to place an order/)).toBeVisible();
});

test("an order confirmation page redirects a signed-out visitor to login", async ({ page }) => {
  await page.goto("/checkout/confirmation/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/login\?redirect=/);
});
