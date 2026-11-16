import { test, expect } from "@playwright/test";

/**
 * The studio's own pages (/studio): the services match the homepage's seven, the work page shows all three projects, and
 * the hero shows Aperionie Apparels. (The homepage's list is checked against the studio's in tests/unit/studio-services.test.ts.)
 */
const SERVICE_TITLES = [
  "Website Development",
  "Ecommerce Experiences",
  "Branding & Visual Identity",
  "Digital Marketing & Social Media",
  "SEO & Growth",
  "Custom Web Applications",
  "AI & Business Automation",
];

test("the services page lists the homepage's seven services, each with its own page", async ({ page }) => {
  await page.goto("/studio/services");
  await expect(page.getByRole("heading", { name: /Seven ways we help/ })).toBeVisible();
  await expect(page.locator("article h2")).toHaveText(SERVICE_TITLES);

  await page.getByRole("link", { name: "Full details" }).nth(4).click(); // SEO & Growth
  await expect(page).toHaveURL(/\/studio\/services\/seo-growth$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("people find");
});

test("a service that was renamed still opens from its old address", async ({ page }) => {
  const response = await page.goto("/studio/services/business-digitalization");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/studio\/services\/ai-business-automation$/);
  await expect(page.getByText("AI & Business Automation").first()).toBeVisible();
});

test("the enquiry form offers all seven services", async ({ page }) => {
  await page.goto("/studio/get-started?service=seo-growth");
  for (const title of SERVICE_TITLES) {
    await expect(page.getByRole("button", { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
  }
  // They are toggle buttons; the one the link named starts selected.
  await expect(page.getByRole("button", { name: /SEO & Growth/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Website Development/ })).toHaveAttribute("aria-pressed", "false");
});

test("the work page shows the store, Aperionie Foods and Aperionie Apparels, with links that open the real sites", async ({ page }) => {
  await page.goto("/studio/work");
  await expect(page.getByRole("heading", { level: 2 }).filter({ hasText: /^(Aperionie Adornments|Aperionie Foods|Aperionie Apparels)$/ })).toHaveText([
    "Aperionie Adornments",
    "Aperionie Foods",
    "Aperionie Apparels",
  ]);

  const slice = page.getByRole("link", { name: /Open the site.*opens in a new tab/ });
  await expect(slice).toHaveCount(2);
  await expect(slice.nth(0)).toHaveAttribute("href", "https://foods.aperionie.com");
  await expect(slice.nth(1)).toHaveAttribute("href", "https://apparels.aperionie.com");
  await expect(slice.nth(0)).toHaveAttribute("rel", /noopener/);
  await expect(page.getByRole("link", { name: "Open the demo store" })).toHaveAttribute("href", "/shop");
  await expect(page.getByRole("link", { name: "I want something like this" }).nth(1)).toHaveAttribute("href", "/studio/get-started?service=website-development");
});

test("the studio's hero shows Aperionie Apparels on a browser and on a phone", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByRole("img", { name: /Aperionie Apparels, our 3D fashion lookbook: nine looks/ })).toBeVisible();
  await expect(page.getByRole("img", { name: "The same project on a phone" })).toBeVisible();
});
