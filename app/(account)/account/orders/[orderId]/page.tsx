import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForAccount } from "@/actions/orders.actions";
import { OrderStatusBadge } from "@/features/account/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/features/account/components/PaymentStatusBadge";
import { OrderTimeline } from "@/features/account/components/OrderTimeline";
import { CancelOrderDialog } from "@/features/account/components/CancelOrderDialog";
import { ReorderButton } from "@/features/account/components/ReorderButton";
import { formatCurrency } from "@/utils/format-currency";

export const metadata: Metadata = { title: "Order Detail" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderForAccount(orderId);
  if (!order) notFound();

  const address = order.shippingAddress;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-foreground">{order.orderReference}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on{" "}
            {order.createdAt.toLocaleDateString("en-PK", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <OrderTimeline status={order.status} />

      <div className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <h2 className="font-heading text-lg text-foreground">Items</h2>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="font-medium text-foreground">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.variantName ? `${item.variantName} · ` : ""}Qty {item.quantity}
                </p>
                {order.status === "delivered" && item.product?.slug && (
                  <Link
                    href={`/products/${item.product.slug}?orderId=${order.id}#reviews`}
                    className="text-xs text-primary hover:underline"
                  >
                    Leave a Review
                  </Link>
                )}
              </div>
              <span className="text-sm text-foreground">{formatCurrency(item.totalPrice)}</span>
            </div>
          ))}

          <div className="space-y-1 pt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-foreground">{formatCurrency(order.shippingAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {order.status === "pending" && (
              <CancelOrderDialog orderId={order.id} orderReference={order.orderReference} />
            )}
            <ReorderButton orderId={order.id} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="mb-2 font-heading text-lg text-foreground">Shipping Address</h2>
            <p className="text-sm text-foreground">{address.fullName}</p>
            <p className="text-sm text-muted-foreground">{address.phone}</p>
            <p className="text-sm text-muted-foreground">
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ""}
              , {address.city}
              {address.province ? `, ${address.province}` : ""}
              {address.postalCode ? ` ${address.postalCode}` : ""}
            </p>
          </div>
          <div>
            <h2 className="mb-2 font-heading text-lg text-foreground">Payment</h2>
            <p className="text-sm text-muted-foreground">
              {order.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer (EasyPaisa / JazzCash)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
