export const BRAND = {
  // The studio's name. The logo is in components/brand (Logo.tsx); the icons are app/icon.svg, favicon.ico and apple-icon.png.
  name: "Aperionie",
  descriptor: "Web Development & Digital Marketing",
  tagline: "We help businesses go digital and grow online.",
  // The site's address. NEXT_PUBLIC_APP_URL (set in Vercel) takes priority wherever a full address is needed; this is the fallback.
  domain: "aperionie.com",
} as const;

/**
 * The live demo store (/shop) is a project of the studio with an identity of its own, the way a client's store would have:
 * it keeps its own name, tagline and colours, and does not take the studio's logo.
 */
export const STORE_BRAND = {
  name: "Aperionie Adornments",
  tagline: "Where Every Sparkle Tells Your Story.",
} as const;

/** Mirrors the CSS tokens in app/globals.css — the stylesheet is the source of truth for the UI. */
export const BRAND_COLORS = {
  primary: "#AF5071", // Raspberry
  secondary: "#F4C6CF", // Blush
  accent: "#FFF7F7", // Blush-white
  plum: "#4E3844",
  gold: "#B58B45",
  background: "#FFFFFF",
  text: "#221D1D", // Warm ink
  success: "#3F7D56",
} as const;

/** The logo pack's two colours: ink and ivory. */
export const LOGO_COLORS = {
  ink: "#121211",
  ivory: "#F3EEE4",
} as const;

// EasyPaisa/JazzCash/WhatsApp numbers, shipping rate, and auto-cancel hours
// are runtime-editable admin settings, not brand constants — see
// db/schema/settings.ts and constants/settings-keys.ts.
