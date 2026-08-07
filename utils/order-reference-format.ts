/** Pure formatting half of the order reference — the sequence itself lives in Postgres and isn't unit-testable in isolation (specs/16), but this is. No DB import here, unlike generate-order-reference.ts, so it's importable in unit tests without a live DATABASE_URL. */
export function formatOrderReference(year: number, sequenceValue: string | number): string {
  return `LL-${year}-${String(sequenceValue).padStart(5, "0")}`;
}
