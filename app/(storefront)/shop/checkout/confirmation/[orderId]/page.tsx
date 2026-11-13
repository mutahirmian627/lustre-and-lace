import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/actions/orders.actions";
import { getSetting } from "@/lib/settings";
import { requireSessionOrRedirect } from "@/lib/session";
import { SETTINGS_KEYS } from "@/constants/settings-keys";
import { buildWhatsAppLink } from "@/services/whatsapp.service";
import { formatCurrency } from "@/utils/format-currency";
import { CODConfirmation } from "@/features/checkout/components/CODConfirmation";
import { EasyPaisaJazzCashInstructions } from "@/features/checkout/components/EasyPaisaJazzCashInstructions";

export const metadata: Metadata = { title: "Order Confirmed" };

export default async function CheckoutConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireSessionOrRedirect();
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) notFound();

  const whatsappNumber = await getSetting(SETTINGS_KEYS.whatsappBusinessNumber);
  const [easypaisaNumber, jazzcashNumber] =
    order.paymentMethod === "manual_transfer"
      ? await Promise.all([
          getSetting(SETTINGS_KEYS.easypaisaNumber),
          getSetting(SETTINGS_KEYS.jazzcashNumber),
        ])
      : ["", ""];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm text-muted-foreground">Order Reference</p>
        <p className="font-heading text-2xl text-foreground">{order.orderReference}</p>
      </div>

      {order.paymentMethod === "cod" ? (
        <CODConfirmation />
      ) : (
        <EasyPaisaJazzCashInstructions
          orderReference={order.orderReference}
          totalAmount={order.totalAmount}
          easypaisaNumber={easypaisaNumber}
          jazzcashNumber={jazzcashNumber}
          whatsappLink={buildWhatsAppLink(whatsappNumber, order.orderReference)}
        />
      )}

      <div className="mt-8 space-y-3 rounded-lg border border-border p-5">
        <h2 className="font-heading text-lg text-foreground">Order Summary</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-foreground">
              {item.productName}
              {item.variantName ? ` — ${item.variantName}` : ""} × {item.quantity}
            </span>
            <span className="text-foreground">{formatCurrency(item.totalPrice)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 font-medium">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <Link href={`/shop/account/orders/${order.id}`} className="text-sm font-medium text-primary hover:underline">
          Track this order
        </Link>
      </div>

      <div className="mt-4 text-center">
        <Link href="/shop/products" className="text-sm text-primary hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
