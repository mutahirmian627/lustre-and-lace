import type { MetadataRoute } from "next";
import { BRAND } from "@/constants/brand";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/shop/account", "/admin", "/super-admin", "/api", "/shop/checkout", "/shop/cart"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
