export const BRAND = {
  name: "Lustre & Lace",
  // The studio is the front door of the site; the jewellery store is its live demo project.
  descriptor: "Web Development & Digital Marketing",
  tagline: "We help businesses go digital and grow online.",
  storeTagline: "Where Every Sparkle Tells Your Story.",
  domain: "lustreandlace.com",
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

// EasyPaisa/JazzCash/WhatsApp numbers, shipping rate, and auto-cancel hours
// are runtime-editable admin settings, not brand constants — see
// db/schema/settings.ts and constants/settings-keys.ts.
