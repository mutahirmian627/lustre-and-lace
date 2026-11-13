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

/** How the number is written for people (the link form above is for wa.me). */
export const IMMERSIVE_WHATSAPP_DISPLAY = "0323 6022290";
export const IMMERSIVE_INSTAGRAM_HANDLE = "@lustreandlacestudio";

/**
 * The full-screen menu. Every entry goes somewhere that works today: an in-page chapter, or an existing
 * page of the site. As later stages add chapters (work, method, studio) their entries move in-page.
 */
export const IMMERSIVE_MENU = [
  { label: "Approach", href: "/#approach", note: "How we work" },
  { label: "Services", href: "/#services", note: "What we build" },
  { label: "Work", href: "/#work", note: "The live demo store" },
  { label: "Process", href: "/#process", note: "From first chat to launch" },
  { label: "About", href: "/about", note: "How we think" },
  { label: "Demo store", href: "/shop", note: "Try it yourself" },
  { label: "Start a project", href: "/get-started", note: "Free quote" },
] as const;

