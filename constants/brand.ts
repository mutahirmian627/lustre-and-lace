export const BRAND = {
  name: "Lustre & Lace",
  tagline: "Where Every Sparkle Tells Your Story.",
  domain: "lustreandlace.com",
} as const;

export const BRAND_COLORS = {
  primary: "#F8D7E6", // Blush Pink
  secondary: "#B76E79", // Rose Gold
  accent: "#FFF8F4", // Cream
  background: "#FFFFFF",
  text: "#2F2F2F", // Dark Charcoal
  success: "#6E9C82", // Soft Emerald
} as const;

// EasyPaisa/JazzCash/WhatsApp numbers, shipping rate, and auto-cancel hours
// are runtime-editable admin settings, not brand constants — see
// db/schema/settings.ts and constants/settings-keys.ts.
