import { test, expect } from "@playwright/test";

/**
 * Register -> verify email via the test-mode email capture (not a real
 * inbox, specs/16) -> log in. Exercises lib/resend.test-mode.ts and the
 * /api/test/last-email inspection route end to end.
 */
test("register, verify via captured email, then log in", async ({ page, request, baseURL }) => {
  await request.delete(`${baseURL}/api/test/last-email`);

  const timestamp = Date.now();
  const email = `e2e-verify-${timestamp}@example.com`;
  const password = "TestPassword1";

  await page.goto("/shop/register");
  await page.getByLabel("Full name").fill("E2E Verify User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-email/, { timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  const emailResponse = await request.get(`${baseURL}/api/test/last-email`);
  expect(emailResponse.ok()).toBeTruthy();
  const captured = await emailResponse.json();
  expect(captured.to).toBe(email);
  expect(captured.subject).toContain("Verify your email");

  const hrefMatch = captured.html.match(/href="([^"]+)"/);
  expect(hrefMatch).not.toBeNull();
  // The email HTML entity-escapes the href (correct for HTML) — undo that
  // before treating it as a literal URL, or "&amp;callbackURL=..." becomes
  // part of the token value instead of a separate query param.
  const verifyUrl = (hrefMatch[1] as string).replace(/&amp;/g, "&");

  await page.goto(verifyUrl);
  await expect(page.getByText("Email verified")).toBeVisible({ timeout: 45_000 });

  // Log in with the now-verified account.
  await page.goto("/shop/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).not.toHaveURL(/\/login/, { timeout: 45_000 });
});
