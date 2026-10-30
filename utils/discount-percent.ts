/** Whole-number "% off" for a sale price, or 0 when there's no real discount. */
export function getDiscountPercent(
  price: string | number,
  compareAtPrice: string | number | null | undefined
): number {
  if (compareAtPrice == null) return 0;
  const current = Number(price);
  const original = Number(compareAtPrice);
  if (!(original > current)) return 0;
  return Math.round((1 - current / original) * 100);
}
