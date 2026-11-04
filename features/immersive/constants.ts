/**
 * Facts shared by the immersive experience. Kept apart from the live site's constants so the
 * experiment can be reviewed (and thrown away) without touching production.
 *
 * The WhatsApp number is stored the way wa.me wants it (country code, no leading zero):
 * 03236022290 becomes 923236022290. The live site reads its number from Admin > Settings;
 * this value is only used here until the experience replaces the homepage.
 */
export const IMMERSIVE_WHATSAPP_NUMBER = "923236022290";
export const IMMERSIVE_INSTAGRAM_URL = "https://instagram.com/lustreandlacestudio";

/** The anchor element the 3D gem is attached to. The canvas reads its position every frame. */
export const GEM_ANCHOR_ID = "gem-anchor";

/** What the studio offers, in the order it is presented. Capabilities only: no claims of results. */
export const IMMERSIVE_SERVICES = [
  "Website development",
  "Ecommerce",
  "Custom web apps",
  "Branding & identity",
  "Social media",
  "Marketing & ads",
  "SEO",
  "AI & process automation",
  "WhatsApp automation",
  "Immersive 3D experiences",
] as const;
