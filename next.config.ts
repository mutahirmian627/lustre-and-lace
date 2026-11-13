import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site's addresses were reorganised: `/` is the 3D homepage, the studio's pages live under /studio and the store's
  // under /shop. Every old address redirects (permanently, keeping the query string) to its new home, so bookmarks,
  // search results and links in emails already sent keep working. (/admin, /super-admin and /api are unchanged.)
  async redirects() {
    const moved = (names: string[], prefix: string) =>
      names.flatMap((name) => [
        { source: `/${name}`, destination: `/${prefix}/${name}`, permanent: true },
        { source: `/${name}/:path*`, destination: `/${prefix}/${name}/:path*`, permanent: true },
      ]);
    return [
      // The immersive homepage's old preview address. (Only this exact path: the pictures under /immersive/ in public/ are still served.)
      { source: "/immersive", destination: "/", permanent: true },
      ...moved(["work", "about", "services", "get-started"], "studio"),
      ...moved(
        ["products", "categories", "cart", "checkout", "wishlist", "sale", "search", "track-order", "contact", "policies", "account", "login", "register", "forgot-password", "reset-password", "verify-email"],
        "shop"
      ),
    ];
  },
  // The Playwright webServer runs a second, separate `next dev` process
  // (playwright.config.ts) alongside the manually-managed one on port 3000 —
  // both writing to the same .next/trace file causes an EPERM crash on
  // Windows, so the E2E process gets its own build directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    // Default is 60s, so optimized images were being re-fetched and re-encoded
    // from the origin almost every visit. Cloudinary URLs change when an image
    // is replaced, so a long TTL is safe.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // picsum.photos: dev-only sample images from db/seed-dev-data.ts, not
      // used for real product images — safe to remove once Cloudinary is
      // wired up for real.
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
