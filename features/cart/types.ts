export interface CartLineItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  imageUrl: string | null;
  quantity: number;
  priceAtAdd: string;
  currentPrice: string;
  stockQuantity: number;
}

export interface CartSummary {
  items: CartLineItem[];
  subtotal: number;
  itemCount: number;
  shippingRate: number;
}

export interface CouponState {
  code: string;
  discountAmount: number;
  type: "percentage" | "fixed";
}
