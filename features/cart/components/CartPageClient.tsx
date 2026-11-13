"use client";

import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCart } from "@/features/cart/context/CartProvider";
import { CartLineItem } from "@/features/cart/components/CartLineItem";
import { CartSummary } from "@/features/cart/components/CartSummary";

export function CartPageClient() {
  const { cart } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-3xl text-foreground">Shopping Cart</h1>

      {cart.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse our collection and find something you'll love."
          actionLabel="Browse Products"
          actionHref="/shop/products"
        />
      ) : (
        <div className="grid gap-8 md:grid-cols-[1fr_320px]">
          <div className="divide-y divide-border rounded-xl border border-border bg-card px-4 sm:px-6">
            {cart.items.map((item) => (
              <div key={item.id} className="py-5">
                <CartLineItem item={item} />
              </div>
            ))}
          </div>
          <div className="md:sticky md:top-28 md:self-start">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}
