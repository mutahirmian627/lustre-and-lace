import type { MetadataRoute } from "next";
import { isNull, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { SERVICES } from "@/constants/agency";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lustreandlace.com";

const STATIC_ROUTES = [
  "",
  "/studio",
  "/services",
  ...SERVICES.map((service) => `/services/${service.slug}`),
  "/work",
  "/about",
  "/get-started",
  "/shop",
  "/products",
  "/sale",
  "/search",
  "/cart",
  "/wishlist",
  "/track-order",
  "/contact",
  "/policies/shipping",
  "/policies/returns",
  "/policies/faq",
  "/login",
  "/register",
];

/**
 * Dynamic routes are generated from the database at request time, not
 * hand-maintained. (account)/(admin)/api are deliberately excluded — belt
 * and suspenders alongside robots.ts already blocking them (specs/15).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [activeProducts, activeCategories] = await Promise.all([
    db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(and(eq(products.isActive, true), isNull(products.deletedAt))),
    db
      .select({ slug: categories.slug, updatedAt: categories.updatedAt })
      .from(categories)
      .where(and(eq(categories.isActive, true), isNull(categories.deletedAt))),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const productEntries: MetadataRoute.Sitemap = activeProducts.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  const categoryEntries: MetadataRoute.Sitemap = activeCategories.map((c) => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    lastModified: c.updatedAt,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
