import { test, expect } from "@playwright/test";

/**
 * Guest browses -> adds to cart -> checks out with manual transfer ->
 * confirmation shows the EasyPaisa/JazzCash numbers and a working
 * wa.me deep link (specs/16).
 */
test("guest can complete a manual-transfer checkout", async ({ page }) => {
  await page.goto("/products/everyday-stud-earrings");
  await page.getByRole("button", { name: "Add to Cart" }).click();

  // The mini cart drawer opens once the add-to-cart Server Action actually
  // resolves — this click's built-in auto-wait is the real sync point.
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  const timestamp = Date.now();
  await page.getByLabel("Full name").first().fill("E2E Manual Transfer");
  await page.getByLabel("Email").fill(`e2e-manual-${timestamp}@example.com`);
  await page.getByLabel("Phone").first().fill("03211234567");

  await page.getByLabel("Full name").nth(1).fill("E2E Manual Transfer");
  await page.getByLabel("Phone").nth(1).fill("03211234567");
  await page.getByLabel("Address line 1").fill("House 2, Street 2, Test Town");
  await page.getByLabel("City").fill("Karachi");

  await page.getByRole("radio", { name: /Bank Transfer/ }).click();
  await page.getByRole("button", { name: "Place Order" }).click();

  await expect(page).toHaveURL(/\/checkout\/confirmation\//, { timeout: 45_000 });
  await expect(page.getByText("Complete Your Payment")).toBeVisible();
  await expect(page.getByText(/EasyPaisa:/)).toBeVisible();
  await expect(page.getByText(/JazzCash:/)).toBeVisible();

  const whatsappLink = page.getByRole("link", { name: "Send Payment Screenshot on WhatsApp" });
  await expect(whatsappLink).toBeVisible();
  await expect(whatsappLink).toHaveAttribute("href", /^https:\/\/wa\.me\//);
});
