import { AGENCY_FAQS, CASE_STUDY, INDUSTRIES, PACKAGES, PROCESS_STEPS, SERVICES, getService } from "@/constants/agency";
import { APERIONIE_APPARELS as APPARELS, APERIONIE_FOODS as FOODS } from "@/features/immersive/work";
import type { FaqDTO } from "@/features/support/types";

/**
 * What the studio's chat helper knows. Every answer is built from the studio's own content (constants/agency.ts: the
 * services, packages, process and FAQs, and features/immersive/work.ts: the projects), so it cannot drift from the pages and
 * says nothing the pages don't. No prices, because the studio doesn't publish any: it quotes per project.
 */
export interface StudioFaq extends FaqDTO {
  /** Pages worth opening next. */
  links?: { label: string; href: string }[];
}

const GET_STARTED = { label: "Start a project", href: "/studio/get-started" };

/** One of the studio's own FAQs, by its question. */
function agencyFaq(question: string): string {
  const faq = AGENCY_FAQS.find((item) => item.question === question);
  if (!faq) throw new Error(`Studio FAQ not found: ${question}`);
  return faq.answer;
}

/** The deliverables of a service, as a short list. */
function pointsOf(slug: string, take = 4): string {
  const service = getService(slug);
  if (!service) throw new Error(`Service not found: ${slug}`);
  return service.deliverables
    .slice(0, take)
    .map((item) => `• ${item}`)
    .join("\n");
}

export function buildStudioFaqs(): StudioFaq[] {
  const services = SERVICES.map((service) => service.title).join(", ");
  const packages = PACKAGES.map((pack) => `• ${pack.name}: ${pack.forWho.replace(/^For /, "for ")}`).join("\n");
  const steps = PROCESS_STEPS.map((step, index) => `${index + 1}. ${step.title}: ${step.body}`).join("\n");

  return [
    {
      id: "services",
      question: "What services do you offer?",
      answer: `We offer ${SERVICES.length} services: ${services}. Each stands on its own, and they work even better together.`,
      links: [{ label: "See all services", href: "/studio/services" }],
    },
    {
      id: "packages",
      question: "What packages do you offer?",
      answer: `There are three ways to begin:\n${packages}\nEvery project is scoped to your business, so there's no price list. You get a clear written quote before any work starts.`,
      links: [{ label: "Get a quote", href: "/studio/get-started" }],
    },
    {
      id: "cost",
      question: "How much does it cost?",
      answer: agencyFaq("How much does it cost?"),
      links: [GET_STARTED],
    },
    {
      id: "time",
      question: "How long does it take?",
      answer: agencyFaq("How long does it take?"),
    },
    {
      id: "process",
      question: "How does a project work?",
      answer: `It runs in five steps:\n${steps}`,
    },
    {
      id: "work",
      question: "Can I see your work?",
      answer: `Yes. There are three projects you can open and try: ${CASE_STUDY.name} (an online store), ${FOODS.name} (a 3D food-ordering site) and ${APPARELS.name} (a 3D fashion lookbook). They are our own demos, so nothing real is sold, and we'll add client work here as we finish it, with permission.`,
      links: [{ label: "Our work", href: "/studio/work" }],
    },
    {
      id: "quote",
      question: "How do I get a quote or start a project?",
      answer:
        "Tell us about your business in the short form. It's free with no commitment: we read your details, ask a few questions if needed, and reply with honest advice and a clear written quote before any work starts.",
      links: [GET_STARTED],
    },
    {
      id: "technical",
      question: "Do I need to know anything technical?",
      answer: agencyFaq("Do I need to know anything technical?"),
    },
    {
      id: "own",
      question: "Will I own my website?",
      answer: agencyFaq("Will I own my website?"),
    },
    {
      id: "payments",
      question: "Can customers pay with Cash on Delivery, EasyPaisa or JazzCash?",
      answer: agencyFaq("Can customers pay with Cash on Delivery, EasyPaisa or JazzCash?"),
    },
    {
      id: "redesign",
      question: "Can you redesign my existing website?",
      answer: `Yes. A redesign is part of Website Development, for a site that is slow, dated or hard to use on a phone. What you get:\n${pointsOf("website-development", 4)}\nTell us your current address in the enquiry form.`,
      links: [{ label: "Website Development", href: "/studio/services/website-development" }, GET_STARTED],
    },
    {
      id: "branding",
      question: "Do you design logos and branding?",
      answer: `Yes, as Branding & Visual Identity:\n${pointsOf("branding-visual-identity", 4)}`,
      links: [{ label: "Branding & Visual Identity", href: "/studio/services/branding-visual-identity" }],
    },
    {
      id: "social",
      question: "Do you run social media and ads?",
      answer: agencyFaq("Do you also run social media and ads?"),
      links: [{ label: "Digital Marketing & Social Media", href: "/studio/services/social-media-marketing" }],
    },
    {
      id: "seo",
      question: "Do you do SEO, and can you get me to the top of Google?",
      answer: `No one can honestly promise the number one spot on Google, so we promise the work (SEO & Growth):\n${pointsOf("seo-growth", 4)}`,
      links: [{ label: "SEO & Growth", href: "/studio/services/seo-growth" }],
    },
    {
      id: "apps",
      question: "Can you build custom software, like a customer portal or a booking system?",
      answer: `Yes, as Custom Web Applications:\n${pointsOf("custom-web-applications", 4)}`,
      links: [{ label: "Custom Web Applications", href: "/studio/services/custom-web-applications" }],
    },
    {
      id: "automation",
      question: "Do you do WhatsApp automation or AI assistants?",
      answer: `Yes, as AI & Business Automation, always with a person able to step in:\n${pointsOf("ai-business-automation", 4)}`,
      links: [{ label: "AI & Business Automation", href: "/studio/services/ai-business-automation" }],
    },
    {
      id: "who",
      question: "Who do you work with?",
      answer: `Small businesses in Pakistan, in areas like ${INDUSTRIES.slice(0, -1)
        .map((item) => item.toLowerCase())
        .join(", ")}. If your business is something else, tell us about it and we'll say honestly whether we can help.`,
      links: [GET_STARTED],
    },
  ];
}

/** Said when nothing matches: no guessing, a way to reach a person. */
export const STUDIO_NO_MATCH =
  "I couldn't find an answer to that. I only know the basics about our services and how we work. Tell us about your project and we'll reply with honest advice and a clear quote.";

export const STUDIO_GREETING =
  "Hi, welcome to Aperionie. Ask about our services, packages or how a project works. Pick a question below or type your own.";
