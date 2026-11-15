import { CASE_STUDY } from "@/constants/agency";

/**
 * The exhibition on the ivory hall's right wall: the work the studio can show, one stop at a time. Each stop is what the
 * camera stands in front of: the frames hung there (real screenshots of the live projects) and the words for it. The last
 * stop is the empty arch, "Next exhibit: yours". Everything claimed here is something the projects really do; nothing is
 * invented (no client names, results or testimonials).
 *
 * This is the one place to add a project: add its screenshots to public/work/ and its stops here, and the wall, the
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

export const WORK_STOPS_DATA: readonly WorkStop[] = [
  // ---- the demo store
  {
    frames: [{ src: "/agency/store-category.jpg", kind: "browser" }],
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
    frames: [{ src: "/agency/store-product.jpg", kind: "browser" }],
    words: { type: "list", kind: "What your customers get", items: CASE_STUDY.storeFeatures },
  },
  {
    frames: [
      { src: "/agency/store-mobile.jpg", kind: "phone" },
      { src: "/agency/store-mobile-product.jpg", kind: "phone" },
    ],
    words: { type: "list", kind: "On a phone, and what you get to run it", items: CASE_STUDY.adminFeatures },
  },

  // ---- Slice & Stack
  {
    frames: [
      { src: "/portfolio/slice-and-stack-hero.jpg", kind: "browser" },
      { src: "/portfolio/slice-and-stack-phone-hero.jpg", kind: "phone" },
    ],
    words: {
      type: "project",
      kind: "Demo project: 3D food ordering",
      name: "Slice & Stack",
      text: "A scroll-driven 3D site for a pizza and burger brand, with a complete ordering system behind it. It's our own demo, so no food is made, charged or delivered.",
      links: [
        { label: "Open the site", href: "https://slice-and-stack.vercel.app", external: true, primary: true },
        { label: "I want something like this", href: link("ecommerce") },
      ],
    },
  },
  {
    frames: [
      { src: "/portfolio/slice-and-stack-menu.jpg", kind: "browser" },
      { src: "/portfolio/slice-and-stack-phone-menu.jpg", kind: "phone" },
    ],
    words: {
      type: "list",
      kind: "What it does",
      items: [
        "A scroll-driven 3D story: a pizza and a burger built layer by layer",
        "Menu, cart and checkout, as a guest or signed in",
        "Delivery or pickup, paid by cash, EasyPaisa or JazzCash, with coupons",
        "Live order tracking for the customer",
        "A kitchen board for the team",
        "Menu and coupon admin, with sales analytics",
      ],
      tags: ["Next.js", "React", "TypeScript", "three.js", "GSAP", "PostgreSQL", "Cloudinary"],
    },
  },

  // ---- Atelier N°9
  {
    frames: [
      { src: "/portfolio/atelier-n9-ring.jpg", kind: "browser" },
      { src: "/portfolio/atelier-n9-phone-ring.jpg", kind: "phone" },
    ],
    words: {
      type: "project",
      kind: "Demo project: 3D fashion lookbook",
      name: "Atelier N°9",
      text: "An immersive lookbook for a clothing brand: nine looks on a circular 3D runway that you can spin, open up and add to a bag. It's our own demo, with a sample catalogue.",
      links: [
        { label: "Open the site", href: "https://atelier-n9-phi.vercel.app", external: true, primary: true },
        { label: "I want something like this", href: link("website-development") },
      ],
    },
  },
  {
    frames: [
      { src: "/portfolio/atelier-n9-focus.jpg", kind: "browser" },
      { src: "/portfolio/atelier-n9-phone-focus.jpg", kind: "phone" },
    ],
    words: {
      type: "list",
      kind: "What it does",
      items: [
        "Nine looks on a circular 3D runway that plays by itself and follows your drag",
        "A ring view and a grid view that morph into each other",
        "A focus view for each look, with tap-to-shop dots on the pieces",
        "A bag, and a receipt-style slip that adds up the fit",
        "Optional background music, off until you turn it on",
        "A calmer version for people who prefer reduced motion",
      ],
      tags: ["Next.js", "React", "TypeScript", "three.js", "GSAP", "Tailwind CSS"],
    },
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
