import { z } from "zod";

// Pakistani mobile numbers: "03XXXXXXXXX" or "+923XXXXXXXXX" (matches specs/03).
const PK_PHONE_REGEX = /^(\+92|0)3\d{9}$/;

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.email("Enter a valid email address").toLowerCase(),
  customerPhone: z.string().regex(PK_PHONE_REGEX, "Enter a valid Pakistani phone number"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(PK_PHONE_REGEX, "Enter a valid Pakistani phone number"),
  addressLine1: z.string().min(3, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  saveAddress: z.boolean().optional(),
  paymentMethod: z.enum(["cod", "manual_transfer"]),
  couponCode: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
