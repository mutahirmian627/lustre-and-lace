import type { Metadata } from "next";
import { STORE_BRAND } from "@/constants/brand";

/**
 * What the demo store's pages (/shop and everything under it: the shop, the account, sign-in) say about themselves, in
 * place of the studio's defaults from app/layout.tsx: the Aperionie Adornments favicon and app icon (public/brand/store),
 * its name in tab titles and when shared. A page's own title, description or pictures still win.
 */
export const STORE_METADATA: Metadata = {
  title: { default: STORE_BRAND.name, template: `%s | ${STORE_BRAND.name}` },
  description: `${STORE_BRAND.name}, a live demo store of elegant, affordable artificial jewellery, built by Aperionie.`,
  icons: {
    icon: [
      { url: "/brand/store/favicon.ico", sizes: "48x48" },
      { url: "/brand/store/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/brand/store/apple-touch-icon.png",
  },
  openGraph: { type: "website", siteName: STORE_BRAND.name },
};
