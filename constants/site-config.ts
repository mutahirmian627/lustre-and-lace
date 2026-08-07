/**
 * Copy that doesn't belong in the database — reused across the PDP
 * accordion (specs/06) and the dedicated policy pages linked from the
 * footer (specs/05). Editing this file is the intended way to change this
 * copy; no admin UI is planned for it.
 */
/**
 * Hero banner content — static/config-driven, no Homepage Banners table
 * (specs/05). Edit this to change the hero without touching component code.
 */
export const HERO_BANNER = {
  headline: "Where Every Sparkle Tells Your Story",
  subtext:
    "Elegant, affordable artificial jewellery for everyday wear, celebrations, and your biggest moments.",
  ctaLabel: "Shop New Arrivals",
  ctaHref: "/products?sort=newest",
  imageUrl: null as string | null,
} as const;

/** Larger-format aspirational section — a brand priority, not just another product row (specs/05). */
export const WEDDING_COLLECTION_BANNER = {
  headline: "Say Yes to Timeless Elegance",
  subtext: "Curated pieces for engagements, mehndi, and your big day.",
  ctaLabel: "Explore the Wedding Collection",
  ctaHref: "/categories/wedding-collection",
  imageUrl: null as string | null,
} as const;

/** Dismissible-for-the-session announcement bar copy (specs/05). */
export const ANNOUNCEMENT_BAR_TEXT =
  "Free shipping notice coming soon — Cash on Delivery available nationwide.";

/**
 * Manually curated Instagram images — no live Graph API integration
 * (specs/05). Empty until real Cloudinary URLs + post links are added; the
 * section hides itself when this is empty rather than showing broken tiles.
 */
export const INSTAGRAM_GALLERY: { imageUrl: string; postUrl?: string }[] = [];

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/lustreandlace",
} as const;

export const SITE_POLICIES = {
  shipping: `We dispatch every order within 1-2 business days. Delivery across Pakistan
typically takes 3-5 business days via our courier partners. Cash on Delivery is
available nationwide; bank transfer orders are dispatched once payment is
confirmed.`,
  returns: `Not quite right? Unworn items with tags attached can be returned within 7
days of delivery for a replacement or store credit. Earrings can't be returned
for hygiene reasons unless the item arrives damaged or defective. Contact us
via WhatsApp with your order reference to start a return.`,
} as const;
