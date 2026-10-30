import { test, expect } from "@playwright/test";

/**
 * Quick answers need no account; talking to the team does (specs/17 follow-up).
 * Signed-out only, so it writes nothing to the database.
 */
test("a visitor gets quick answers, and is asked to sign in before talking to the team", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open chat" }).click();

  await page.getByRole("button", { name: "What is your return policy?" }).click();
  await expect(page.getByText(/Unworn items with tags attached/)).toBeVisible();

  await page.getByLabel("Ask, or enter an order number").fill("how many days for shipping");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/3-5 business days/)).toBeVisible();

  await page.getByRole("button", { name: "Talk to our team" }).click();
  await expect(page.getByText(/Please sign in so our team knows/)).toBeVisible();
  await expect(page.getByRole("dialog").locator('a[href^="/login?redirect="]')).toBeVisible();
  await expect(page.getByLabel("Message to our team")).toHaveCount(0);
});

test("the bot looks up an order by number without a login, and says so when it can't find one", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open chat" }).click();

  await page.getByRole("button", { name: "Check my order status" }).click();
  await expect(page.getByText(/No sign-in needed/)).toBeVisible();

  // A well-formed number that can't exist: exercises the real lookup without depending on seeded orders.
  await page.getByLabel("Ask, or enter an order number").fill("LL-9999-99999");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/couldn't find an order LL-9999-99999/)).toBeVisible();

  // Nothing about the signed-out lookup should require or imply an account.
  await expect(page.getByText(/Please sign in so our team knows/)).toHaveCount(0);
});

test("live support endpoints reject signed-out visitors", async ({ request }) => {
  expect((await request.get("/api/support/thread")).status()).toBe(401);
  expect((await request.get("/api/admin/support/conversations")).status()).toBe(404);
  expect((await request.get("/api/admin/support/unread")).status()).toBe(404);
});
