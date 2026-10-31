import type { Metadata, Viewport } from "next";
import { playfairDisplay, publicSans } from "@/styles/fonts";
import { Toaster } from "@/components/ui/sonner";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { BRAND } from "@/constants/brand";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`;
const DEFAULT_DESCRIPTION =
  "Lustre & Lace is a web development and digital marketing studio. We build professional websites and online stores, set up WhatsApp, social media and ads, and help small businesses grow online.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} | ${BRAND.descriptor}`,
    template: `%s | ${BRAND.name}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} | ${BRAND.descriptor}`,
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
  themeColor: "#4E3844", // Plum
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${publicSans.variable}`}
    >
      <body className="antialiased">
        <RouteProgress />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
