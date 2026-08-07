import { NextResponse, type NextRequest } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSetting } from "@/lib/settings";
import { SETTINGS_KEYS } from "@/constants/settings-keys";
import { applyCancellationSideEffects } from "@/lib/order-cancellation";
import { resend, FROM_EMAIL } from "@/lib/resend";
import OrderCancelled from "@/emails/order-cancelled";

/**
 * Cancels manual-transfer orders that have sat unpaid past the configured
 * threshold (specs/11). COD orders have no "unpaid" signal the way manual
 * transfer does, so they're never touched here.
 *
 * Secured by CRON_SECRET rather than session auth — Vercel Cron calls this
 * with no user attached, so it can't go through the normal auth guard.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hours = Number(await getSetting(SETTINGS_KEYS.autoCancelUnpaidHours));
  const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);

  const staleOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.paymentMethod, "manual_transfer"),
      eq(orders.paymentStatus, "awaiting_confirmation"),
      eq(orders.status, "pending"),
      lt(orders.createdAt, threshold)
    ),
    with: { items: true },
  });

  for (const order of staleOrders) {
    await applyCancellationSideEffects(order);

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: order.customerEmail,
        subject: `Order Cancelled — ${order.orderReference}`,
        react: OrderCancelled({
          customerName: order.customerName,
          orderReference: order.orderReference,
          items: order.items.map((item) => ({
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          })),
          totalAmount: order.totalAmount,
          wasRefunded: false,
        }),
      });
    } catch (error) {
      console.error(`Auto-cancel email failed for ${order.orderReference}:`, error);
    }
  }

  return NextResponse.json({ cancelled: staleOrders.length });
}
