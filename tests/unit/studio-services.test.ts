import { describe, expect, it } from "vitest";
import { SERVICES as STUDIO_SERVICES, getService } from "@/constants/agency";
import { SERVICES as HOMEPAGE_SERVICES } from "@/features/immersive/content";
import { SERVICE_SLUGS, inquirySchema } from "@/features/agency/types";

/**
 * The studio's pages and the 3D homepage list the same services. These keep the two in step (same names, same order), and
 * keep the enquiry form's accepted values and the old address of a renamed service working.
 */
describe("the studio's services", () => {
  it("are the homepage's seven, with the same names in the same order", () => {
    expect(STUDIO_SERVICES.map((service) => service.title)).toEqual(HOMEPAGE_SERVICES.map((service) => service.name));
  });

  it("each have a distinct address, a headline, deliverables and a suitable audience", () => {
    expect(new Set(STUDIO_SERVICES.map((service) => service.slug)).size).toBe(STUDIO_SERVICES.length);
    for (const service of STUDIO_SERVICES) {
      expect(service.headline.length, service.slug).toBeGreaterThan(10);
      expect(service.deliverables.length, service.slug).toBeGreaterThanOrEqual(5);
      expect(service.goodFor.length, service.slug).toBeGreaterThanOrEqual(3);
      expect(service.tags.length, service.slug).toBe(3);
    }
  });

  it("are exactly what the enquiry form accepts", () => {
    expect([...SERVICE_SLUGS]).toEqual(STUDIO_SERVICES.map((service) => service.slug));
  });

  it("can all be picked in an enquiry", () => {
    const enquiry = {
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      businessName: "Ayesha Boutique",
      services: STUDIO_SERVICES.map((service) => service.slug),
      message: "I would like help with all of these, please.",
    };
    expect(inquirySchema.safeParse(enquiry).success).toBe(true);
  });

  it("still find the service whose address changed", () => {
    expect(getService("business-digitalization")?.slug).toBe("ai-business-automation");
    expect(getService("not-a-service")).toBeUndefined();
  });
});
