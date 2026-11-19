import { describe, expect, it } from "vitest";
import { findBestFaq } from "@/features/support/faq-match";
import { buildStudioFaqs, STUDIO_NO_MATCH } from "@/features/studio-chat/faqs";
import { PACKAGES, PROCESS_STEPS, SERVICES } from "@/constants/agency";

const faqs = buildStudioFaqs();
const idOf = (query: string) => findBestFaq(query, faqs)?.id ?? null;

describe("the studio chat's answers", () => {
  it("have distinct ids, and every question finds its own answer", () => {
    expect(new Set(faqs.map((faq) => faq.id)).size).toBe(faqs.length);
    for (const faq of faqs) expect(idOf(faq.question), faq.question).toBe(faq.id);
  });

  it("find the right answer for the way people really ask", () => {
    expect(idOf("how much does it cost")).toBe("cost");
    expect(idOf("what are your prices")).toBe("cost");
    expect(idOf("what packages do you have")).toBe("packages");
    expect(idOf("how long will it take")).toBe("time");
    expect(idOf("what services do you offer")).toBe("services");
    expect(idOf("can I see examples of your work")).toBe("work");
    expect(idOf("can you redesign my website")).toBe("redesign");
    expect(idOf("do you do logos")).toBe("branding");
    expect(idOf("do you do seo")).toBe("seo");
    expect(idOf("I need a customer portal")).toBe("apps");
    expect(idOf("do you build a whatsapp chatbot")).toBe("automation");
    expect(idOf("how do I start a project")).toBe("quote");
  });

  it("say nothing when nothing matches, rather than guess", () => {
    expect(idOf("hello")).toBeNull();
    expect(idOf("what is the meaning of life")).toBeNull();
    expect(STUDIO_NO_MATCH).toMatch(/Tell us about your project/);
  });

  it("are built from the studio's own content: every service, package and step is in the answers", () => {
    const text = (id: string) => faqs.find((faq) => faq.id === id)!.answer;
    for (const service of SERVICES) expect(text("services")).toContain(service.title);
    for (const pack of PACKAGES) expect(text("packages")).toContain(pack.name);
    for (const step of PROCESS_STEPS) expect(text("process")).toContain(step.title);
  });

  it("promise no prices and no guaranteed rankings", () => {
    const all = faqs.map((faq) => faq.answer).join("\n");
    expect(all).not.toMatch(/\bRs\.?\s?\d|\$\s?\d|PKR\s?\d/);
    expect(faqs.find((faq) => faq.id === "seo")!.answer).toMatch(/No one can honestly promise/);
  });

  it("only link to pages that exist on the studio", () => {
    const slugs = SERVICES.map((service) => service.slug);
    for (const faq of faqs) {
      for (const link of faq.links ?? []) {
        const ok =
          ["/studio/services", "/studio/work", "/studio/get-started"].includes(link.href) ||
          slugs.some((slug) => link.href === `/studio/services/${slug}`);
        expect(ok, `${faq.id}: ${link.href}`).toBe(true);
      }
    }
  });
});
