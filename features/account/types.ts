import { z } from "zod";

// Pakistani mobile numbers: "03XXXXXXXXX" or "+923XXXXXXXXX" (specs/03).
const PK_PHONE_REGEX = /^(\+92|0)3\d{9}$/;

export const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(PK_PHONE_REGEX, "Enter a valid Pakistani phone number")
    .optional()
    .or(z.literal("")),
});
export type ProfileFormInput = z.infer<typeof profileFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least one number"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ["confirmNewPassword"],
  });
export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;

export const addressFormSchema = z.object({
  label: z.string().max(40).optional().or(z.literal("")),
  fullName: z.string().min(2, "Enter a full name"),
  phone: z.string().regex(PK_PHONE_REGEX, "Enter a valid Pakistani phone number"),
  addressLine1: z.string().min(3, "Enter an address"),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "Enter a city"),
  province: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});
export type AddressFormInput = z.infer<typeof addressFormSchema>;

export const deleteAccountConfirmSchema = z.object({
  confirmationText: z.literal("DELETE", 'Type "DELETE" to confirm'),
});
export type DeleteAccountConfirmInput = z.infer<typeof deleteAccountConfirmSchema>;
