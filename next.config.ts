import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Playwright webServer runs a second, separate `next dev` process
  // (playwright.config.ts) alongside the manually-managed one on port 3000 —
  // both writing to the same .next/trace file causes an EPERM crash on
  // Windows, so the E2E process gets its own build directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
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
