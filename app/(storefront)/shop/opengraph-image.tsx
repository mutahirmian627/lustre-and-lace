import { ImageResponse } from "next/og";
import { STORE_BRAND, LOGO_COLORS } from "@/constants/brand";
import { LOGO_ART } from "@/components/brand/logo-art";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ART = LOGO_ART.store.stacked;
const [, , artWidth, artHeight] = ART.viewBox.split(" ").map(Number);

/**
 * The share image for the demo store's pages that have no picture of their own (products and categories use their
 * photography): the Aperionie Adornments stacked logo, ink on ivory, from its logo pack.
 */
export default async function Image() {
  const logoWidth = 700;
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
          backgroundColor: LOGO_COLORS.ivory,
        }}
      >
        <svg
          width={logoWidth}
          height={Math.round((logoWidth * artHeight) / artWidth)}
          viewBox={ART.viewBox}
          fill={LOGO_COLORS.ink}
        >
          {ART.paths.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
        <div
          style={{
            marginTop: 48,
            fontSize: 28,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: LOGO_COLORS.ink,
            opacity: 0.7,
          }}
        >
          {STORE_BRAND.tagline}
        </div>
      </div>
    ),
    size
  );
}
