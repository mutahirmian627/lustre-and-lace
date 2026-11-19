import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { BRAND } from "@/constants/brand";
import { SHOP_HOST, SHOP_ORIGIN } from "@/lib/shop-origin";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`;

/** Each address has its own robots.txt: the store's paths have no /shop prefix on the store's own address. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = SHOP_HOST ? ((await headers()).get("host") ?? "").toLowerCase() : "";
  if (SHOP_ORIGIN && host === SHOP_HOST) {
    return {
      rules: { userAgent: "*", allow: "/", disallow: ["/account", "/checkout", "/cart", "/admin", "/super-admin", "/api"] },
      sitemap: `${SHOP_ORIGIN}/sitemap.xml`,
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/shop/account", "/admin", "/super-admin", "/api", "/shop/checkout", "/shop/cart"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
