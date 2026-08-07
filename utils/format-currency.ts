const PKR_FORMATTER = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formats a PKR amount as "Rs 12,500". Accepts a string because Drizzle's
 * `numeric` columns (basePrice, price, totals) come back as strings, not
 * numbers, to avoid float-precision loss on money values.
 */
export function formatCurrency(amountInPkr: number | string): string {
  const amount =
    typeof amountInPkr === "string" ? Number(amountInPkr) : amountInPkr;
  return PKR_FORMATTER.format(amount).replace("PKR", "Rs");
}
