/** Matches "LL-2026-00013" however a customer types it: any case, spaces or dashes, or no separators at all. */
const ORDER_REFERENCE_PATTERN = /\bLL[\s-]?(\d{4})[\s-]?(\d{5})\b/i;

export function extractOrderReference(text: string): string | null {
  const match = ORDER_REFERENCE_PATTERN.exec(text);
  return match ? `LL-${match[1]}-${match[2]}` : null;
}

/** "Where is my order" without a number — the bot should ask for the number rather than guess an FAQ. */
export function looksLikeOrderStatusQuestion(text: string): boolean {
  return /\b(track|tracking|status|where(?:'s| is)?\s+my)\b/i.test(text) && /\border|parcel|package|delivery\b/i.test(text);
}

export interface OrderStatusInput {
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "cod_pending" | "awaiting_confirmation" | "paid" | "failed" | "refunded";
  paymentMethod: "cod" | "manual_transfer";
}

export interface OrderStatusMessage {
  headline: string;
  detail: string;
  tone: "neutral" | "good" | "attention" | "bad";
}

/**
 * Customer-facing wording for an order's state. Fulfillment and payment move
 * independently (db/schema/orders.ts), so "pending" reads differently
 * depending on whether we're waiting on a transfer or just haven't started yet.
 */
export function describeOrderStatus({ status, paymentStatus, paymentMethod }: OrderStatusInput): OrderStatusMessage {
  switch (status) {
    case "cancelled":
      return {
        headline: "Cancelled",
        detail:
          paymentStatus === "refunded"
            ? "This order was cancelled and your payment has been refunded."
            : "This order was cancelled. If you think this is a mistake, talk to our team and we'll sort it out.",
        tone: "bad",
      };
    case "delivered":
      return { headline: "Delivered", detail: "Your order has been delivered. We hope you love it.", tone: "good" };
    case "shipped":
      return { headline: "On its way", detail: "Your order has been dispatched and is on its way to you.", tone: "good" };
    case "processing":
      return { headline: "Being prepared", detail: "We're getting your order ready for dispatch.", tone: "good" };
    case "pending":
      if (paymentMethod === "manual_transfer" && paymentStatus === "awaiting_confirmation") {
        return {
          headline: "Waiting for your payment",
          detail:
            "We haven't confirmed your payment yet. Send your payment screenshot on WhatsApp with this order number and we'll confirm it.",
          tone: "attention",
        };
      }
      if (paymentStatus === "paid") {
        return { headline: "Payment received", detail: "We've confirmed your payment and will start preparing your order shortly.", tone: "good" };
      }
      return {
        headline: "Order received",
        detail: "We've received your order and will start preparing it shortly. You'll pay in cash when it arrives.",
        tone: "neutral",
      };
  }
}
