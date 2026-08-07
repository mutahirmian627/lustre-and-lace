/**
 * Controlled variant attribute values (specs/06). productVariants.attributes
 * is a flexible jsonb bag at the DB level, but filter checkboxes need known
 * keys/values — admins pick from these lists rather than typing free text.
 */
export const PRODUCT_ATTRIBUTES = {
  plating: ["Gold Plated", "Silver Plated", "Rose Gold Plated", "Antique Gold"],
  color: ["Clear/White", "Pink", "Green", "Red", "Multicolor"],
  size: ["Adjustable", "Small", "Medium", "Large"],
} as const;

export type ProductAttributeKey = keyof typeof PRODUCT_ATTRIBUTES;
