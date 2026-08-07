import { z } from "zod";

export const variantFormSchema = z.object({
  id: z.string().uuid().optional(), // present when editing an existing variant
  name: z.string().min(1, "Enter a variant name"),
  sku: z.string().optional().or(z.literal("")),
  price: z.coerce.number().positive("Enter a price"),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal("")),
  stockQuantity: z.coerce.number().int().min(0, "Stock can't be negative"),
  plating: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  size: z.string().optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});
export type VariantFormInput = z.infer<typeof variantFormSchema>;

export const productImageFormSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().min(1, "Image URL is required"),
  altText: z.string().optional().or(z.literal("")),
  variantKey: z.string().optional().or(z.literal("")), // matches a variant's client-side key, "" = product-level image
  isPrimary: z.boolean().optional(),
});
export type ProductImageFormInput = z.infer<typeof productImageFormSchema>;

export const productFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().or(z.literal("")),
  categoryId: z.string().uuid("Select a category"),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal("")),
  sku: z.string().optional().or(z.literal("")),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  isActive: z.boolean().optional(),
  variants: z.array(variantFormSchema).min(1, "Add at least one variant"),
  images: z.array(productImageFormSchema),
});
export type ProductFormInput = z.infer<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  parentId: z.string().uuid().optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().optional(),
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export const couponFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive("Enter a value"),
  minOrderAmount: z.coerce.number().positive().optional().or(z.literal("")),
  maxDiscountAmount: z.coerce.number().positive().optional().or(z.literal("")),
  usageLimit: z.coerce.number().int().positive().optional().or(z.literal("")),
  startsAt: z.string().optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});
export type CouponFormInput = z.infer<typeof couponFormSchema>;

export const platformSettingsFormSchema = z.object({
  easypaisaNumber: z.string().min(1),
  jazzcashNumber: z.string().min(1),
  whatsappBusinessNumber: z.string().min(1),
  flatShippingRatePkr: z.coerce.number().min(0),
  autoCancelUnpaidHours: z.coerce.number().int().positive(),
});
export type PlatformSettingsFormInput = z.infer<typeof platformSettingsFormSchema>;
