import { test, expect } from "@playwright/test";

/**
 * A guest adds an item to their cart, then registers — RegisterForm calls
 * mergeGuestCart() right after signup (specs/09), so the item should carry
 * over into the new account's cart instead of being dropped.
 */
test("guest cart merges into the account on registration", async ({ page }) => {
  await page.goto("/products/pearl-drop-earrings");
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("heading", { name: "Pearl Drop Earrings" })).toBeVisible({
    timeout: 45_000,
  });

  const timestamp = Date.now();
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Merge User");
  await page.getByLabel("Email").fill(`e2e-merge-${timestamp}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("TestPassword1");
  await page.getByLabel("Confirm password").fill("TestPassword1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-email/, { timeout: 45_000 });

  await page.goto("/cart");
  await expect(page.getByRole("link", { name: "Pearl Drop Earrings" })).toBeVisible();
});
