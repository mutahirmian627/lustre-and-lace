import React from "react";
import { Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";
import { OrderItemsSummary, type OrderEmailItem } from "./OrderItemsSummary";
import { formatCurrency } from "@/utils/format-currency";

const BODY_STYLE = { color: "#2F2F2F", fontSize: 15, lineHeight: "24px" };

export default function OrderCancelled({
  customerName,
  orderReference,
  items,
  totalAmount,
  wasRefunded,
}: {
  customerName: string;
  orderReference: string;
  items: OrderEmailItem[];
  totalAmount: string;
  wasRefunded: boolean;
}) {
  return (
    <EmailLayout previewText={`Order ${orderReference} cancelled`}>
      <Text style={BODY_STYLE}>Hi {customerName},</Text>
      <Text style={BODY_STYLE}>
        Your order <strong>{orderReference}</strong> has been cancelled.
      </Text>

      <OrderItemsSummary items={items} />

      <Text style={{ ...BODY_STYLE, fontWeight: 700 }}>Total: {formatCurrency(totalAmount)}</Text>

      {wasRefunded ? (
        <Text style={BODY_STYLE}>
          Since your payment had already been confirmed, our team will process a refund to the
          same account you paid from.
        </Text>
      ) : (
        <Text style={BODY_STYLE}>No payment was taken, so there&apos;s nothing to refund.</Text>
      )}
    </EmailLayout>
  );
}
