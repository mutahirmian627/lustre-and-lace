import { ImageResponse } from "next/og";
import { BRAND_COLORS } from "@/constants/brand";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Generated monogram favicon (specs/15) — replace with a real brand icon before launch. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BRAND_COLORS.secondary,
          color: "#FFFFFF",
          fontSize: 20,
          fontWeight: 700,
          borderRadius: "50%",
        }}
      >
        L
      </div>
    ),
    size
  );
}
