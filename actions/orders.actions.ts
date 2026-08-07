import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

/**
 * Used by the checkout confirmation page right after placeOrder redirects
 * here — the UUID itself acts as an unguessable capability token, since a
 * guest has no session to check ownership against. The Orders milestone
 * (specs/11) extends this file with the full account-scoped list/detail,
 * cancellation, and guest track-by-reference lookups.
 */
export async function getOrderById(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
}
