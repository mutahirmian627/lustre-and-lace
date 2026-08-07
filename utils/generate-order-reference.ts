import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Backed by a Postgres SEQUENCE (db/migrations/0001) rather than "count
 * existing orders + 1" — a sequence is atomic under concurrent checkouts,
 * a row count is not. The sequence never resets; the year is just a label
 * captured at generation time (specs/10).
 */
export async function generateOrderReference(): Promise<string> {
  const result = await db.execute<{ val: string }>(sql`select nextval('order_reference_seq') as val`);
  const value = result.rows[0].val;
  const year = new Date().getFullYear();
  return `LL-${year}-${String(value).padStart(5, "0")}`;
}
