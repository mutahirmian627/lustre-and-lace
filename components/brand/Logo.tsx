import { LOGO_ART } from "./logo-art";

/**
 * The logos, drawn inline so they take the colour of the text around them (currentColor): ink on the ivory pages, ivory
 * on plum, and they follow the 3D page as it flips from plum to ivory. The artwork is from the logo packs
 * (components/brand/logo-art.ts).
 *
 * Two brands:
 * - "studio" (default): Aperionie, the studio (the homepage, /studio, the studio's emails).
 * - "store": Aperionie Adornments, the live demo store under /shop (its own pack: the same A, with a small diamond).
 *
 * Variants:
 * - "lockup": the monogram and the name side by side (headers).
 * - "wordmark": the name alone (for the store, with "Adornments" under it).
 * - "monogram": the A alone (tight spaces).
 * - "stacked": the monogram over the name (centred layouts).
 *
 * The logo is the name, so it carries it as its accessible name; pass `decorative` where the name is already read out
 * next to it.
 */
export type LogoBrand = keyof typeof LOGO_ART;
export type LogoVariant = keyof (typeof LOGO_ART)["studio"];

export const LOGO_NAMES: Record<LogoBrand, string> = { studio: "Aperionie", store: "Aperionie Adornments" };

export function Logo({
  brand = "studio",
  variant = "lockup",
  className,
  decorative = false,
}: {
  brand?: LogoBrand;
  variant?: LogoVariant;
  className?: string;
  decorative?: boolean;
}) {
  const art = LOGO_ART[brand][variant];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={art.viewBox}
      fill="currentColor"
      className={className}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": LOGO_NAMES[brand] })}
      focusable="false"
    >
      {art.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
