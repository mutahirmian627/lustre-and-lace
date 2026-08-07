import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
