import { test, expect } from "@playwright/test";

/**
 * The demo store on its own address, as in production (see playwright.shop-host.config.ts): adornments.localhost is the store's
 * address, localhost the main one. Run with: npx playwright test -c playwright.shop-host.config.ts
 */
const MAIN = "http://localhost:3006";
const SHOP = "http://adornments.localhost:3006";

test("the store's home is the root of its own address", async ({ page }) => {
  await page.goto("/");
  expect(page.url()).toBe(`${SHOP}/`);
  await expect(page).toHaveTitle(/Aperionie Adornments/);
  await expect(page.getByRole("link", { name: "Aperionie Adornments, shop home" })).toBeVisible();
});

test("clean addresses answer, and clicking around keeps them clean", async ({ page }) => {
  await page.goto("/products");
  expect(page.url()).toBe(`${SHOP}/products`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // The pages' own links are still written /shop/...: following one must land on the clean address.
  const product = page.locator('a[href^="/shop/products/"]').first();
  await product.click();
  await expect(page).toHaveURL(new RegExp(`^${SHOP.replace(/[.]/g, "\\.")}/products/[^/]+(\\?.*)?$`));
  await expect(page.getByRole("button", { name: /add to cart/i }).first()).toBeVisible();

  // And the shop's own navigation does too (the header's Contact link).
  await page.goto("/");
  await page.locator('header a[href="/shop/contact"]').first().click();
  await expect(page).toHaveURL(`${SHOP}/contact`);
});

test("the old /shop addresses go to the clean ones, with the query", async ({ page }) => {
  await page.goto("/shop/products?sort=newest");
  expect(page.url()).toBe(`${SHOP}/products?sort=newest`);
  await page.goto("/shop");
  expect(page.url()).toBe(`${SHOP}/`);
});

test("the main address sends the store's pages to the store's address", async ({ page }) => {
  await page.goto(`${MAIN}/shop/products?x=1`);
  expect(page.url()).toBe(`${SHOP}/products?x=1`);
  await page.goto(`${MAIN}/shop`);
  expect(page.url()).toBe(`${SHOP}/`);
  // Addresses from before the /shop move still end up in the right place.
  await page.goto(`${MAIN}/products`);
  expect(page.url()).toBe(`${SHOP}/products`);
});

test("the studio belongs to the main address", async ({ page }) => {
  await page.goto("/studio/work");
  expect(page.url()).toBe(`${MAIN}/studio/work`);
  await expect(page.getByRole("heading", { name: /Three projects/ })).toBeVisible();

  await page.goto(`${MAIN}/studio`);
  expect(page.url()).toBe(`${MAIN}/studio`);
  await page.goto(MAIN + "/");
  expect(page.url()).toBe(`${MAIN}/`);
  await expect(page).toHaveTitle(/Aperionie \| Pretty Websites/);
});

test("the API and the pictures answer on the store's address", async ({ page }) => {
  await page.goto("/");
  const results = await page.evaluate(async () => {
    const faqs = await fetch("/api/support/faqs");
    const picture = await fetch("/demo/bangles-1.jpg");
    return { faqs: faqs.status, picture: picture.status, type: picture.headers.get("content-type") };
  });
  expect(results.faqs).toBe(200);
  expect(results.picture).toBe(200);
  expect(results.type).toMatch(/^image\//);
});

test("checkout and the admin panel ask for sign-in, with clean addresses", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page).toHaveURL(`${SHOP}/login?redirect=%2Fcheckout`);
  await page.goto("/account");
  await expect(page).toHaveURL(`${SHOP}/login?redirect=%2Faccount`);
  await page.goto("/admin");
  await expect(page).toHaveURL(`${SHOP}/login?redirect=%2Fadmin`);
});

test("robots and the sitemap are each address's own", async ({ page }) => {
  await page.goto("/robots.txt");
  const shopRobots = await page.locator("body").innerText();
  expect(shopRobots).toContain(`Sitemap: ${SHOP}/sitemap.xml`);
  expect(shopRobots).toContain("Disallow: /account");

  await page.goto(`${MAIN}/robots.txt`);
  const mainRobots = await page.locator("body").innerText();
  expect(mainRobots).toContain(`Sitemap: ${MAIN}/sitemap.xml`);
});

test("sign-up, email verification and sign-in work on the store's address, and the visitor stays signed in", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => fetch("/api/test/last-email", { method: "DELETE" }));

  const email = `e2e-shop-host-${Date.now()}@example.com`;
  const password = "TestPassword1";

  await page.goto("/register");
  expect(page.url()).toBe(`${SHOP}/register`);
  await page.getByLabel("Full name").fill("E2E Shop Host User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-email/, { timeout: 45_000 });
  expect(page.url().startsWith(SHOP)).toBe(true);

  const captured = await page.evaluate(async () => (await fetch("/api/test/last-email")).json());
  expect(captured.to).toBe(email);
  const hrefMatch = (captured.html as string).match(/href="([^"]+)"/);
  expect(hrefMatch).not.toBeNull();
  const verifyUrl = hrefMatch![1].replace(/&amp;/g, "&");

  await page.goto(verifyUrl);
  await expect(page.getByText("Email verified")).toBeVisible({ timeout: 45_000 });

  await page.goto(`${SHOP}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 45_000 });
  expect(page.url().startsWith(SHOP)).toBe(true);

  // Signed in: the account page opens and stays on the clean address; signing-in pages send a signed-in visitor on.
  await page.goto("/account");
  expect(page.url()).toBe(`${SHOP}/account`);
  await page.goto("/login");
  await expect(page).not.toHaveURL(/\/login/);
});
