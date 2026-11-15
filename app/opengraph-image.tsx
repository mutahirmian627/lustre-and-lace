import { ImageResponse } from "next/og";
import { BRAND, LOGO_COLORS } from "@/constants/brand";
import { LOGO_ART } from "@/components/brand/logo-art";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ART = LOGO_ART.studio.stacked;
const [, , artWidth, artHeight] = ART.viewBox.split(" ").map(Number);

/**
 * The share image for pages that don't have a picture of their own (product and category pages override it with their
 * photography): the Aperionie stacked logo in ink on ivory, drawn from the logo pack's artwork.
 */
export default async function Image() {
  const logoWidth = 640;
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
            marginTop: 56,
            fontSize: 30,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: LOGO_COLORS.ink,
            opacity: 0.7,
          }}
        >
          {BRAND.descriptor}
        </div>
      </div>
    ),
    size
  );
}
