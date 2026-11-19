import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isNull, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { SERVICES } from "@/constants/agency";
import { BRAND } from "@/constants/brand";
import { SHOP_HOST, SHOP_ORIGIN, stripShopPrefix } from "@/lib/shop-origin";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`;

const STUDIO_ROUTES = [
  "",
  "/studio",
  "/studio/services",
  ...SERVICES.map((service) => `/studio/services/${service.slug}`),
  "/studio/work",
  "/studio/about",
  "/studio/get-started",
];

const SHOP_ROUTES = [
  "/shop",
  "/shop/products",
  "/shop/sale",
  "/shop/search",
  "/shop/cart",
  "/shop/wishlist",
  "/shop/track-order",
  "/shop/contact",
  "/shop/policies/shipping",
  "/shop/policies/returns",
  "/shop/policies/faq",
  "/shop/login",
  "/shop/register",
];

const STATIC_ROUTES = [...STUDIO_ROUTES, ...SHOP_ROUTES];

/**
 * Dynamic routes are generated from the database at request time, not
 * hand-maintained. (account)/(admin)/api are deliberately excluded — belt
 * and suspenders alongside robots.ts already blocking them (specs/15).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // With the store on its own address, each address lists its own pages (the store's with clean paths).
  const host = SHOP_HOST ? ((await headers()).get("host") ?? "").toLowerCase() : "";
  const shopOnly = !!SHOP_ORIGIN && host === SHOP_HOST;
  const studioOnly = !!SHOP_ORIGIN && !shopOnly;
  const shopUrl = (path: string) => (SHOP_ORIGIN ? `${SHOP_ORIGIN}${stripShopPrefix(path) === "/" ? "" : stripShopPrefix(path)}` : `${SITE_URL}${path}`);

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

  const staticEntries: MetadataRoute.Sitemap = (shopOnly ? SHOP_ROUTES : studioOnly ? STUDIO_ROUTES : STATIC_ROUTES).map((path) => ({
    url: path.startsWith("/shop") ? shopUrl(path) : `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
  if (studioOnly) return staticEntries;

  const productEntries: MetadataRoute.Sitemap = activeProducts.map((p) => ({
    url: shopUrl(`/shop/products/${p.slug}`),
    lastModified: p.updatedAt,
  }));

  const categoryEntries: MetadataRoute.Sitemap = activeCategories.map((c) => ({
    url: shopUrl(`/shop/categories/${c.slug}`),
    lastModified: c.updatedAt,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
