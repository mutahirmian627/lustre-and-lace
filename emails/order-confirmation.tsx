import React from "react";
import { Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";
import { EmailButton } from "./EmailButton";
import { OrderItemsSummary, type OrderEmailItem } from "./OrderItemsSummary";
import { formatCurrency } from "@/utils/format-currency";

const BODY_STYLE = { color: "#2F2F2F", fontSize: 15, lineHeight: "24px" };

export default function OrderConfirmation({
  customerName,
  orderReference,
  items,
  subtotal,
  discountAmount,
  shippingAmount,
  totalAmount,
  paymentMethod,
  easypaisaNumber,
  jazzcashNumber,
  whatsappLink,
}: {
  customerName: string;
  orderReference: string;
  items: OrderEmailItem[];
  subtotal: string;
  discountAmount: string;
  shippingAmount: string;
  totalAmount: string;
  paymentMethod: "cod" | "manual_transfer";
  easypaisaNumber?: string;
  jazzcashNumber?: string;
  whatsappLink?: string;
}) {
  return (
    <EmailLayout previewText={`Order ${orderReference} confirmed`}>
      <Text style={BODY_STYLE}>Hi {customerName},</Text>
      <Text style={BODY_STYLE}>
        Thank you for your order! Here&apos;s a summary of{" "}
        <strong>{orderReference}</strong>.
      </Text>

      <OrderItemsSummary items={items} />

      <Text style={{ ...BODY_STYLE, fontSize: 13, color: "#75706E" }}>
        Subtotal: {formatCurrency(subtotal)}
        {Number(discountAmount) > 0 && <> · Discount: -{formatCurrency(discountAmount)}</>}
        {" "}· Shipping: {formatCurrency(shippingAmount)}
      </Text>
      <Text style={{ ...BODY_STYLE, fontWeight: 700 }}>Total: {formatCurrency(totalAmount)}</Text>

      {paymentMethod === "cod" ? (
        <Text style={BODY_STYLE}>
          Your order will be paid for in cash on delivery. We&apos;ll let you know once it
          ships.
        </Text>
      ) : (
        <>
          <Text style={BODY_STYLE}>
            Please send <strong>{formatCurrency(totalAmount)}</strong> via EasyPaisa or
            JazzCash to one of the numbers below, quoting your order reference{" "}
            <strong>{orderReference}</strong>.
          </Text>
          {easypaisaNumber && (
            <Text style={BODY_STYLE}>EasyPaisa: {easypaisaNumber}</Text>
          )}
          {jazzcashNumber && <Text style={BODY_STYLE}>JazzCash: {jazzcashNumber}</Text>}
          {whatsappLink && (
            <EmailButton href={whatsappLink}>Send Payment Screenshot on WhatsApp</EmailButton>
          )}
          <Text style={{ ...BODY_STYLE, fontSize: 13, color: "#75706E" }}>
            Your order will be processed once payment is verified.
          </Text>
        </>
      )}
    </EmailLayout>
  );
}
