import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lustreandlace.com";

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
