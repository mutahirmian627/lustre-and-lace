import Link from "next/link";
import { formatCurrency } from "@/utils/format-currency";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/context/CartProvider";
import { useWishlist } from "@/features/wishlist/context/WishlistProvider";
import { CouponInput } from "@/features/cart/components/CouponInput";

export function CartSummary() {
  const { cart, coupon, discountAmount, total } = useCart();
  const { isLoggedIn } = useWishlist();
  const hasUnavailableItem = cart.items.some((item) => item.stockQuantity === 0);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-accent p-5">
      <CouponInput />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{formatCurrency(cart.subtotal)}</span>
        </div>
        {coupon && (
          <div className="flex justify-between text-success">
            <span>Discount ({coupon.code})</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-foreground">{formatCurrency(cart.shippingRate)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{formatCurrency(total)}</span>
        </div>
      </div>

      <Button
        nativeButton={false}
        render={<Link href="/shop/checkout" />}
        disabled={cart.items.length === 0 || hasUnavailableItem}
        className="w-full"
      >
        {isLoggedIn ? "Proceed to Checkout" : "Sign in to Checkout"}
      </Button>
      {!isLoggedIn && (
        <p className="text-center text-xs text-muted-foreground">
          An account is required to place an order. Your cart is saved when you sign in.
        </p>
      )}
      {hasUnavailableItem && (
        <p className="text-center text-xs text-destructive">
          Remove unavailable items to continue.
        </p>
      )}
    </div>
  );
}
