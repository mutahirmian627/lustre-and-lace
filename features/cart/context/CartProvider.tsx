"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  addToCart as addToCartAction,
  updateCartItemQuantity as updateCartItemQuantityAction,
  removeCartItem as removeCartItemAction,
  validateCoupon as validateCouponAction,
  getCart,
} from "@/actions/cart.actions";
import type { CartSummary, CouponState } from "@/features/cart/types";

interface CartContextValue {
  cart: CartSummary;
  coupon: CouponState | null;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (input: { productId: string; variantId: string; quantity: number }) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ error?: string }>;
  removeCoupon: () => void;
  discountAmount: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: CartSummary;
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState(initialCart);
  const [coupon, setCoupon] = useState<CouponState | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  async function addItem(input: { productId: string; variantId: string; quantity: number }) {
    const result = await addToCartAction(input);
    if ("error" in result) {
      toast.error(result.error);
      return false;
    }
    setCart(result.cart);
    setIsDrawerOpen(true);
    return true;
  }

  async function updateQuantity(itemId: string, quantity: number) {
    const result = await updateCartItemQuantityAction(itemId, quantity);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setCart(result.cart);
  }

  async function removeItem(itemId: string) {
    const result = await removeCartItemAction(itemId);
    setCart(result.cart);
    if (coupon && result.cart.subtotal === 0) setCoupon(null);
  }

  async function applyCoupon(code: string) {
    const result = await validateCouponAction(code, cart.subtotal);
    if ("error" in result) {
      return { error: result.error };
    }
    setCoupon({ code: result.code, discountAmount: result.discountAmount, type: result.type });
    return {};
  }

  function removeCoupon() {
    setCoupon(null);
  }

  async function refreshCart() {
    setCart(await getCart());
  }

  // A percentage discount (and minOrderAmount eligibility) depends on the
  // subtotal it was computed against — re-validate whenever quantity/removal
  // changes it, rather than leaving the discount frozen at apply-time.
  const previousSubtotal = useRef(cart.subtotal);
  useEffect(() => {
    if (previousSubtotal.current === cart.subtotal) return;
    previousSubtotal.current = cart.subtotal;

    if (!coupon) return;
    validateCouponAction(coupon.code, cart.subtotal).then((result) => {
      if ("error" in result) {
        setCoupon(null);
        toast.error(`${coupon.code} no longer applies: ${result.error}`);
        return;
      }
      setCoupon({ code: result.code, discountAmount: result.discountAmount, type: result.type });
    });
    // coupon is intentionally omitted: this effect reacts to subtotal
    // changes only, reading the latest coupon via closure at fire time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.subtotal]);

  const discountAmount = coupon?.discountAmount ?? 0;
  const total = Math.max(0, cart.subtotal - discountAmount) + (cart.items.length > 0 ? cart.shippingRate : 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        coupon,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        addItem,
        refreshCart,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        discountAmount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
