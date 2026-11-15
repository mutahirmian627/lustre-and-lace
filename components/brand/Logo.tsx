import { LOGO_ART } from "./logo-art";

/**
 * The Aperionie logo, drawn inline so it takes the colour of the text around it (currentColor): ink on the ivory pages,
 * ivory on plum, and it follows the 3D page as it flips from plum to ivory. The artwork is from the Aperture logo pack
 * (components/brand/logo-art.ts).
 *
 * - "lockup": the monogram and the wordmark side by side (headers).
 * - "wordmark": the name alone (where the monogram would repeat the first letter).
 * - "monogram": the A alone (tight spaces).
 * - "stacked": the monogram over the name (centred layouts).
 *
 * The logo is the site's name, so it carries it as its accessible name; pass `decorative` where the name is already read
 * out next to it.
 */
export type LogoVariant = keyof typeof LOGO_ART;

export function Logo({
  variant = "lockup",
  className,
  decorative = false,
}: {
  variant?: LogoVariant;
  className?: string;
  decorative?: boolean;
}) {
  const art = LOGO_ART[variant];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={art.viewBox}
      fill="currentColor"
      className={className}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Aperionie" })}
      focusable="false"
    >
      {art.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
