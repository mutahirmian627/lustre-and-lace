import type { Metadata } from "next";
import { CartPageClient } from "@/features/cart/components/CartPageClient";

export const metadata: Metadata = { title: "Shopping Cart" };

export default function CartPage() {
  return <CartPageClient />;
}
