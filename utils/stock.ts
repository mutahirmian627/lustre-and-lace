/**
 * A cart/merge quantity is never allowed to exceed live stock (specs/09,
 * specs/03) — extracted so the rule is expressed once and is directly
 * unit-testable (specs/16), even though the arithmetic itself is a
 * one-liner.
 */
export function capQuantityToStock(requestedQuantity: number, stockQuantity: number): number {
  return Math.min(requestedQuantity, stockQuantity);
}
