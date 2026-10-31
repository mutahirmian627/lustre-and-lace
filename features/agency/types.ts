import { z } from "zod";
import { PK_PHONE_REGEX } from "@/features/auth/types";

export const SERVICE_SLUGS = [
  "website-development",
  "ecommerce",
  "social-media-marketing",
  "business-digitalization",
] as const;

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(100),
  email: z.email("Enter a valid email address").toLowerCase(),
  // People type "0300 1234567" or "0300-1234567"; spaces and dashes are dropped before checking.
  phone: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.union([z.literal(""), z.string().regex(PK_PHONE_REGEX, "Enter a valid Pakistani mobile number, like 0300 1234567")]))
    .optional(),
  businessName: z.string().trim().min(2, "Tell us the name of your business").max(120),
  industry: z.string().max(60).optional().or(z.literal("")),
  services: z.array(z.enum(SERVICE_SLUGS)).min(1, "Pick at least one service"),
  budgetRange: z.string().max(60).optional().or(z.literal("")),
  existingWebsite: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a little more, at least 10 characters").max(3000),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
