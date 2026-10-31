import { describe, expect, it } from "vitest";
import { inquirySchema } from "@/features/agency/types";

const valid = {
  name: "Ayesha Khan",
  email: "Ayesha@Example.com",
  phone: "",
  businessName: "Ayesha Boutique",
  industry: "Fashion & clothing",
  services: ["ecommerce"],
  budgetRange: "",
  existingWebsite: "",
  message: "I sell dresses on Instagram and want an online store.",
};

describe("inquirySchema", () => {
  it("accepts a complete enquiry and lowercases the email", () => {
    const result = inquirySchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("ayesha@example.com");
  });

  it("accepts Pakistani mobile numbers typed with spaces or dashes and stores them plain", () => {
    for (const phone of ["0300 1234567", "0300-1234567", "+92 300 1234567"]) {
      const result = inquirySchema.safeParse({ ...valid, phone });
      expect(result.success, phone).toBe(true);
      if (result.success) expect(result.data.phone).toMatch(/^(\+92|0)3\d{9}$/);
    }
  });

  it("rejects an invalid phone number, but allows leaving it out", () => {
    expect(inquirySchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, phone: undefined }).success).toBe(true);
  });

  it("needs at least one known service", () => {
    expect(inquirySchema.safeParse({ ...valid, services: [] }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, services: ["hacking"] }).success).toBe(false);
  });

  it("rejects a bad email, a missing business name and a too-short message", () => {
    expect(inquirySchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, businessName: " " }).success).toBe(false);
    expect(inquirySchema.safeParse({ ...valid, message: "hi" }).success).toBe(false);
  });
});
