import React from "react";
import { Column, Row, Section, Text } from "@react-email/components";
import { formatCurrency } from "@/utils/format-currency";

export interface OrderEmailItem {
  productName: string;
  variantName: string | null;
  quantity: number;
  totalPrice: string;
}

/** Shared line-item presentation across every order-related email (specs/14). */
export function OrderItemsSummary({ items }: { items: OrderEmailItem[] }) {
  return (
    <Section style={{ margin: "16px 0" }}>
      {items.map((item, index) => (
        <Row key={index} style={{ padding: "8px 0", borderBottom: "1px solid #EFECEA" }}>
          <Column>
            <Text style={{ margin: 0, color: "#221D1D", fontSize: 14, fontWeight: 600 }}>
              {item.productName}
            </Text>
            <Text style={{ margin: 0, color: "#605858", fontSize: 12 }}>
              {item.variantName ? `${item.variantName} · ` : ""}Qty {item.quantity}
            </Text>
          </Column>
          <Column align="right">
            <Text style={{ margin: 0, color: "#221D1D", fontSize: 14 }}>
              {formatCurrency(item.totalPrice)}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}
