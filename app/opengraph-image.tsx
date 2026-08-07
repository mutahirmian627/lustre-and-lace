import { ImageResponse } from "next/og";
import { BRAND, BRAND_COLORS } from "@/constants/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Branded fallback OG image (specs/15) — generated at request time via
 * next/og rather than a static asset, since no real brand logo/wordmark
 * file exists yet. Product/category pages override this with their own
 * photography; this only appears where no page-specific image is set.
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BRAND_COLORS.accent,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 600,
            color: BRAND_COLORS.text,
            letterSpacing: "0.02em",
          }}
        >
          {BRAND.name}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: BRAND_COLORS.secondary,
          }}
        >
          {BRAND.tagline}
        </div>
      </div>
    ),
    size
  );
}
