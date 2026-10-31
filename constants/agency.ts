/**
 * Copy and structured data for the studio side of the site (/, /services, /work, /about,
 * /get-started). Edit this file to change what the studio says; nothing here comes from the
 * database. Everything claimed below is something the demo store really does — don't add client
 * names, results or testimonials until they exist.
 */

export type ServiceSlug =
  | "website-development"
  | "ecommerce"
  | "social-media-marketing"
  | "business-digitalization";

export interface Service {
  slug: ServiceSlug;
  title: string;
  /** One line on cards. */
  short: string;
  /** Headline on the service's own page. */
  headline: string;
  intro: string;
  /** Business-owner language: what you get. */
  deliverables: string[];
  goodFor: string[];
  /** Keywords shown as small tags on the card. */
  tags: string[];
}

export const SERVICES: Service[] = [
  {
    slug: "website-development",
    title: "Website Development",
    short: "A fast, professional website that makes your business look as good as it is.",
    headline: "A website your customers will trust at first glance.",
    intro:
      "Most customers check you out online before they ever message you. We build clean, mobile-first websites that load quickly, explain what you do in seconds and make it easy to contact you.",
    deliverables: [
      "Custom design in your brand colours and tone, not a recycled template",
      "Mobile-first pages that load fast on ordinary phone connections",
      "Contact form that lands in your inbox, plus a WhatsApp chat button",
      "Basic search-engine setup so people can find you on Google",
      "Google Analytics so you can see who is visiting",
      "Hand-over so you know how everything works and who to ask for changes",
    ],
    goodFor: ["Service businesses", "Boutiques and showrooms", "Clinics, salons and studios", "Restaurants and cafés"],
    tags: ["Business websites", "Landing pages", "Portfolios"],
  },
  {
    slug: "ecommerce",
    title: "Online Stores",
    short: "Sell online with your own store: catalogue, cart, checkout and an admin panel to run it.",
    headline: "Your own online store, built for how Pakistan shops.",
    intro:
      "Stop taking orders one chat message at a time. We build a complete store with a product catalogue, cart and checkout, and an admin panel where you manage products, stock and orders. It supports cash on delivery and manual wallet payments out of the box.",
    deliverables: [
      "Product catalogue with categories, variants (size, colour), photos and search",
      "Cart and checkout with Cash on Delivery, EasyPaisa and JazzCash payment options",
      "Order tracking page and confirmation emails for your customers",
      "Admin panel for products, inventory, orders, coupons, customers and reviews",
      "Discount codes, wishlists and customer reviews with moderation",
      "Sales analytics and CSV export of your orders",
    ],
    goodFor: ["Fashion and jewellery brands", "Beauty and cosmetics", "Home-based sellers", "Small retailers going online"],
    tags: ["E-commerce", "COD & wallets", "Admin panel"],
  },
  {
    slug: "social-media-marketing",
    title: "Social Media & Marketing",
    short: "Profiles, content and ads on Instagram and Facebook that turn viewers into enquiries.",
    headline: "Get found, get noticed, get enquiries.",
    intro:
      "A good website needs visitors. We set up your Instagram and Facebook presence, plan the content, and run paid campaigns that send people to the right page: your store, a product or a WhatsApp chat.",
    deliverables: [
      "Instagram and Facebook business profiles set up properly, matching your brand",
      "A content plan: posts, reels and stories for the products you most want to sell",
      "Meta Ads (Facebook and Instagram) campaigns with sensible audience targeting",
      "Tracking with Meta Pixel and Google Analytics, so you know what an order really costs",
      "A short monthly report in plain language, with what to do next",
    ],
    goodFor: ["Businesses with a website that needs traffic", "New brands building an audience", "Shops running seasonal offers"],
    tags: ["Instagram & Facebook", "Meta Ads", "Content"],
  },
  {
    slug: "business-digitalization",
    title: "Business Digitalization",
    short: "Move the day-to-day online: WhatsApp Business, catalogues, order handling and Google listing.",
    headline: "Take the paperwork and the repeated messages out of your day.",
    intro:
      "Digitalizing doesn't have to mean a huge project. Often it is a handful of practical tools set up well: a WhatsApp Business account with a catalogue, a proper Google listing, and a clear way to record and follow orders.",
    deliverables: [
      "WhatsApp Business setup: profile, catalogue, greeting and quick replies",
      "Google Business Profile so you show up on Google Search and Maps",
      "A digital product catalogue you can share as a link",
      "A simple order workflow: how orders come in, get confirmed and get delivered",
      "Hands-on walkthrough so you and your team know how to use everything",
    ],
    goodFor: ["Shops that sell through chat", "Home-based businesses", "Owners who want less manual work"],
    tags: ["WhatsApp Business", "Google listing", "Order workflow"],
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((service) => service.slug === slug);
}

export const PROCESS_STEPS = [
  {
    title: "Talk",
    body: "A short conversation about your business, your customers and what you want from being online. No jargon.",
  },
  {
    title: "Plan",
    body: "We recommend what you really need, agree the scope and give you a clear quote before any work starts.",
  },
  {
    title: "Build",
    body: "We design and build it in your brand, and share progress as we go so there are no surprises.",
  },
  {
    title: "Launch",
    body: "We test it on real phones, connect payments, email and analytics, and take it live with you.",
  },
  {
    title: "Grow",
    body: "After launch we can keep it running and bring in customers through content and advertising, if you want us to.",
  },
] as const;

export const PACKAGES = [
  {
    name: "Online Presence",
    forWho: "For businesses that need a professional website",
    includes: ["Business website", "Mobile-friendly design", "Contact form and WhatsApp button", "Google and analytics setup"],
    serviceSlug: "website-development" satisfies ServiceSlug,
  },
  {
    name: "Online Store",
    forWho: "For sellers ready to take orders online",
    includes: ["Everything in a store: catalogue, cart, checkout", "COD, EasyPaisa and JazzCash", "Admin panel for orders and stock", "Order emails and tracking"],
    serviceSlug: "ecommerce" satisfies ServiceSlug,
    featured: true,
  },
  {
    name: "Growth Partner",
    forWho: "For businesses that want customers, not only a website",
    includes: ["Social media setup and content plan", "Meta Ads management", "Tracking and monthly report", "Ongoing improvements"],
    serviceSlug: "social-media-marketing" satisfies ServiceSlug,
  },
] as const;

export const DIFFERENTIATORS = [
  {
    title: "You can try what we build",
    body: "Our own demo store is live. Open it, add something to the cart, check out, even look at the admin side. That is the standard your project will be built to.",
  },
  {
    title: "Built for Pakistani customers",
    body: "Cash on Delivery, EasyPaisa and JazzCash, WhatsApp ordering and PKR pricing are part of the design, not afterthoughts.",
  },
  {
    title: "Fast on a normal phone",
    body: "Most of your visitors are on mobile data. We build for that, and measure speed instead of guessing.",
  },
  {
    title: "Yours to keep",
    body: "Your website, your content and your customer data belong to you. No lock-in to a platform you can't leave.",
  },
] as const;

/** The one real project we can show today. */
export const CASE_STUDY = {
  name: "Lustre & Lace Store",
  kind: "Demo project: e-commerce",
  summary:
    "A complete online jewellery store built from scratch to show what we can deliver. It isn't a client project and it doesn't sell to the public; it exists so you can see, and try, a finished store.",
  storeFeatures: [
    "Product catalogue with categories, variants and photo galleries",
    "Search, wishlist and a cart that survives sign-in",
    "Checkout with Cash on Delivery, EasyPaisa and JazzCash",
    "Coupons, product reviews and order tracking",
    "Verified accounts with branded emails",
    "Live support chat with instant answers to common questions",
  ],
  adminFeatures: [
    "Dashboard with sales and order summaries",
    "Products, categories, inventory and coupons",
    "Order management and payment confirmation",
    "Review moderation and customer list",
    "Analytics with CSV export",
    "Owner and admin roles with an audit trail",
  ],
  stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "PostgreSQL", "Cloudinary", "Resend", "Vercel"],
} as const;

export const INDUSTRIES = [
  "Fashion & clothing",
  "Jewellery & accessories",
  "Beauty, salon & cosmetics",
  "Food & restaurant",
  "Home-based business",
  "Retail shop",
  "Services / consulting",
  "Other",
] as const;

export const BUDGET_RANGES = [
  "Not sure yet",
  "Under Rs. 25,000",
  "Rs. 25,000 – 75,000",
  "Rs. 75,000 – 150,000",
  "Rs. 150,000 and above",
] as const;

export const AGENCY_FAQS = [
  {
    question: "Do I need to know anything technical?",
    answer:
      "No. We explain things in plain language, handle the technical setup and show you how to update your own products, prices and content.",
  },
  {
    question: "How much does it cost?",
    answer:
      "It depends on what you need: a simple business website is very different from a full store. Tell us about your business and we'll send a clear quote before any work starts. Advertising budgets are paid to the ad platforms directly and are separate from our fee.",
  },
  {
    question: "How long does it take?",
    answer:
      "A simple website can be live in a couple of weeks; a full online store takes longer because of products, payments and testing. We'll give you a timeline with your quote.",
  },
  {
    question: "Can customers pay with Cash on Delivery, EasyPaisa or JazzCash?",
    answer:
      "Yes. Our stores support Cash on Delivery and manual EasyPaisa or JazzCash payments, where the customer sends a screenshot on WhatsApp and you confirm it in the admin panel.",
  },
  {
    question: "Will I own my website?",
    answer: "Yes. The website, content and customer data are yours, and we'll hand over everything you need.",
  },
  {
    question: "Do you also run social media and ads?",
    answer:
      "Yes, as a separate service. Many clients start with the website or store and add marketing once it's live.",
  },
] as const;
