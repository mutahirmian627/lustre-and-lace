import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWishlistProductIds } from "@/actions/wishlist.actions";
import { getCart } from "@/actions/cart.actions";
import { WishlistProvider } from "@/features/wishlist/context/WishlistProvider";
import { CartProvider } from "@/features/cart/context/CartProvider";
import { MiniCartDrawer } from "@/features/cart/components/MiniCartDrawer";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = !!session?.user;
  const [wishlistProductIds, cart] = await Promise.all([
    isLoggedIn ? getWishlistProductIds() : Promise.resolve([]),
    getCart(),
  ]);

  return (
    <WishlistProvider initialProductIds={wishlistProductIds} isLoggedIn={isLoggedIn}>
      <CartProvider initialCart={cart}>
        <Header isLoggedIn={isLoggedIn} />
        <main>{children}</main>
        <Footer />
        <MiniCartDrawer />
      </CartProvider>
    </WishlistProvider>
  );
}
