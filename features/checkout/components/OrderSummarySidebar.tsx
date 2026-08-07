import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format-currency";
import { CouponInput } from "@/features/cart/components/CouponInput";
import { useCart } from "@/features/cart/context/CartProvider";

export function OrderSummarySidebar({ isSubmitting }: { isSubmitting: boolean }) {
  const { cart, coupon, discountAmount, total } = useCart();

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <h2 className="font-heading text-xl text-foreground">Order Summary</h2>

      <div className="space-y-3">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.imageUrl && (
                <Image src={item.imageUrl} alt={item.productName} fill sizes="48px" className="object-cover" />
              )}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.variantName} · Qty {item.quantity}
              </p>
            </div>
            <span className="text-sm text-foreground">
              {formatCurrency(Number(item.currentPrice) * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <CouponInput />

      <div className="space-y-2 border-t border-border pt-3 text-sm">
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

      <Button type="submit" disabled={isSubmitting || cart.items.length === 0} className="w-full">
        {isSubmitting ? "Placing order..." : "Place Order"}
      </Button>
    </div>
  );
}
