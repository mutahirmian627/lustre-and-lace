import type { Metadata, Viewport } from "next";
import { playfairDisplay, inter } from "@/styles/fonts";
import { Toaster } from "@/components/ui/sonner";
import { BRAND } from "@/constants/brand";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`;
const DEFAULT_DESCRIPTION =
  "Elegant, affordable artificial jewellery for Wedding, Party, and Everyday wear — necklaces, earrings, bangles, and rings for every story you're telling.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: DEFAULT_DESCRIPTION,
  },
  // Left empty until the real verification code is generated once the
  // site is live and added to Google Search Console (specs/15) — flagged
  // here so it isn't forgotten, not filled with a placeholder value.
  verification: {
    google: "",
  },
};

export const viewport: Viewport = {
  themeColor: "#B76E79", // Rose Gold
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${inter.variable}`}
    >
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
