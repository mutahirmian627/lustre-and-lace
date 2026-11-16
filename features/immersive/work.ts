import { CASE_STUDY } from "@/constants/agency";

/**
 * The exhibition on the ivory hall's right wall: the work the studio can show, one stop at a time. Each stop is what the
 * camera stands in front of: the frames hung there (real screenshots of the live projects) and the words for it. The last
 * stop is the empty arch, "Next exhibit: yours". Everything claimed here is something the projects really do; nothing is
 * invented (no client names, results or testimonials).
 *
 * This is the one place to add a project: add its screenshots to public/portfolio/ (not public/work: the old /work redirect would catch it) and its stops here, and the wall, the
 * camera's route, the scroll length, the text and the screen-reader list all follow. (lib/timeline.ts counts the stops;
 * a unit test makes sure the two agree.)
 */

export interface WorkFrame {
  /** A screenshot in public/. */
  src: string;
  /** A browser window, or a phone. */
  kind: "browser" | "phone";
}

export interface WorkLink {
  label: string;
  href: string;
  /** Opens another site, in a new tab. */
  external?: boolean;
  /** The solid button (the other is a quiet link). */
  primary?: boolean;
}

export type WorkWords =
  /** A project's name, what it is, and where to see it. */
  | { type: "project"; kind: string; name: string; text: string; links: readonly WorkLink[] }
  /** What a project does, as points, and what it is built with. */
  | { type: "list"; kind: string; items: readonly string[]; tags?: readonly string[] }
  /** The empty arch. */
  | { type: "next"; kind: string; name: string; text: string };

export interface WorkStop {
  frames: readonly WorkFrame[];
  words: WorkWords;
}

const link = (service: string) => `/studio/get-started?service=${service}`;

/**
 * The facts about the two projects that are not the demo store, in one place: the 3D exhibition below and the studio's
 * Work page (/studio/work) both read them, so a project is described once. Both are the studio's own demos.
 */
export interface WorkProject {
  name: string;
  kind: string;
  /** What it is, in a few sentences. */
  summary: string;
  /** What it does, as points. */
  features: readonly string[];
  /** What it is built with. */
  stack: readonly string[];
  /** The live site. */
  url: string;
  /** The service on the studio's enquiry form that "I want something like this" opens. */
  serviceSlug: string;
  /** Screenshots in public/portfolio: the opening view and a second view, in a browser and on a phone. */
  shots: { desktop: string; phone: string; desktop2: string; phone2: string };
}

export const APERIONIE_FOODS: WorkProject = {
  name: "Aperionie Foods",
  kind: "Demo project: 3D food ordering",
  summary:
    "A scroll-driven 3D site for a pizza and burger brand, with a complete ordering system behind it. It's our own demo, so no food is made, charged or delivered.",
  features: [
    "A scroll-driven 3D story: a pizza and a burger built layer by layer",
    "Menu, cart and checkout, as a guest or signed in",
    "Delivery or pickup, paid by cash, EasyPaisa or JazzCash, with coupons",
    "Live order tracking for the customer",
    "A kitchen board for the team",
    "Menu and coupon admin, with sales analytics",
  ],
  stack: ["Next.js", "React", "TypeScript", "three.js", "GSAP", "PostgreSQL", "Cloudinary"],
  url: "https://foods.aperionie.com",
  serviceSlug: "ecommerce",
  shots: {
    desktop: "/portfolio/aperionie-foods-hero.jpg",
    phone: "/portfolio/aperionie-foods-phone-hero.jpg",
    desktop2: "/portfolio/aperionie-foods-menu.jpg",
    phone2: "/portfolio/aperionie-foods-phone-menu.jpg",
  },
};

export const APERIONIE_APPARELS: WorkProject = {
  name: "Aperionie Apparels",
  kind: "Demo project: 3D fashion lookbook",
  summary:
    "An immersive lookbook for a clothing brand: nine looks on a circular 3D runway that you can spin, open up and add to a bag. It's our own demo, with a sample catalogue.",
  features: [
    "Nine looks on a circular 3D runway that plays by itself and follows your drag",
    "A ring view and a grid view that morph into each other",
    "A focus view for each look, with tap-to-shop dots on the pieces",
    "A bag, and a receipt-style slip that adds up the fit",
    "Optional background music, off until you turn it on",
    "A calmer version for people who prefer reduced motion",
  ],
  stack: ["Next.js", "React", "TypeScript", "three.js", "GSAP", "Tailwind CSS"],
  url: "https://apparels.aperionie.com",
  serviceSlug: "website-development",
  shots: {
    desktop: "/portfolio/aperionie-apparels-ring.jpg",
    phone: "/portfolio/aperionie-apparels-phone-ring.jpg",
    desktop2: "/portfolio/aperionie-apparels-focus.jpg",
    phone2: "/portfolio/aperionie-apparels-phone-focus.jpg",
  },
};

export const WORK_STOPS_DATA: readonly WorkStop[] = [
  // ---- the demo store
  {
    frames: [{ src: "/agency/adornments-category.jpg", kind: "browser" }],
    words: {
      type: "project",
      kind: CASE_STUDY.kind,
      name: CASE_STUDY.name,
      text: CASE_STUDY.summary,
      links: [
        { label: "Open the demo store", href: "/shop", primary: true },
        { label: "I want a store like this", href: link("ecommerce") },
      ],
    },
  },
  {
    frames: [{ src: "/agency/adornments-product.jpg", kind: "browser" }],
    words: { type: "list", kind: "What your customers get", items: CASE_STUDY.storeFeatures },
  },
  {
    frames: [
      { src: "/agency/adornments-mobile.jpg", kind: "phone" },
      { src: "/agency/adornments-mobile-product.jpg", kind: "phone" },
    ],
    words: { type: "list", kind: "On a phone, and what you get to run it", items: CASE_STUDY.adminFeatures },
  },

  // ---- Aperionie Foods
  {
    frames: [
      { src: APERIONIE_FOODS.shots.desktop, kind: "browser" },
      { src: APERIONIE_FOODS.shots.phone, kind: "phone" },
    ],
    words: {
      type: "project",
      kind: APERIONIE_FOODS.kind,
      name: APERIONIE_FOODS.name,
      text: APERIONIE_FOODS.summary,
      links: [
        { label: "Open the site", href: APERIONIE_FOODS.url, external: true, primary: true },
        { label: "I want something like this", href: link(APERIONIE_FOODS.serviceSlug) },
      ],
    },
  },
  {
    frames: [
      { src: APERIONIE_FOODS.shots.desktop2, kind: "browser" },
      { src: APERIONIE_FOODS.shots.phone2, kind: "phone" },
    ],
    words: { type: "list", kind: "What it does", items: APERIONIE_FOODS.features, tags: APERIONIE_FOODS.stack },
  },

  // ---- Aperionie Apparels
  {
    frames: [
      { src: APERIONIE_APPARELS.shots.desktop, kind: "browser" },
      { src: APERIONIE_APPARELS.shots.phone, kind: "phone" },
    ],
    words: {
      type: "project",
      kind: APERIONIE_APPARELS.kind,
      name: APERIONIE_APPARELS.name,
      text: APERIONIE_APPARELS.summary,
      links: [
        { label: "Open the site", href: APERIONIE_APPARELS.url, external: true, primary: true },
        { label: "I want something like this", href: link(APERIONIE_APPARELS.serviceSlug) },
      ],
    },
  },
  {
    frames: [
      { src: APERIONIE_APPARELS.shots.desktop2, kind: "browser" },
      { src: APERIONIE_APPARELS.shots.phone2, kind: "phone" },
    ],
    words: { type: "list", kind: "What it does", items: APERIONIE_APPARELS.features, tags: APERIONIE_APPARELS.stack },
  },

  // ---- the empty arch
  {
    frames: [],
    words: {
      type: "next",
      kind: "Next exhibit",
      name: "Yours.",
      text: "This is where the next project will hang: client work as we finish it, with permission. Until then, these are the honest measure of what we build.",
    },
  },
];
