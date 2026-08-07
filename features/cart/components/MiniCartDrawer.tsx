"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/utils/format-currency";
import { useCart } from "@/features/cart/context/CartProvider";
import { CartLineItem } from "@/features/cart/components/CartLineItem";

export function MiniCartDrawer() {
  const { cart, isDrawerOpen, closeDrawer } = useCart();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto p-6">
        <SheetHeader className="px-0">
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            actionLabel="Browse Products"
            actionHref="/products"
          />
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto py-4">
              {cart.items.map((item) => (
                <CartLineItem key={item.id} item={item} compact />
              ))}
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-foreground">Subtotal</span>
                <span className="text-foreground">{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/cart" />}
                  className="flex-1"
                  onClick={closeDrawer}
                >
                  View Cart
                </Button>
                <Button
                  nativeButton={false}
                  render={<Link href="/checkout" />}
                  className="flex-1"
                  onClick={closeDrawer}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
