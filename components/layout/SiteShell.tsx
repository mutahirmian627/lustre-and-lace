import { getSession } from "@/lib/session";
import { getWishlistProductIds } from "@/actions/wishlist.actions";
import { getCart } from "@/actions/cart.actions";
import { WishlistProvider } from "@/features/wishlist/context/WishlistProvider";
import { CartProvider } from "@/features/cart/context/CartProvider";
import { MiniCartDrawer } from "@/features/cart/components/MiniCartDrawer";
import { SupportChatLauncher } from "@/features/support/components/SupportChatLauncher";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Shared chrome + cart/wishlist context for every area of the site that
 * needs the main header/footer and Add to Cart/wishlist actions to work —
 * (storefront) and (account) both render this rather than duplicating the
 * session/cart/wishlist fetch. (auth) deliberately opts out (its own
 * chrome-less centered-card layout has no cart/wishlist touchpoints).
 */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
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
        <SupportChatLauncher isLoggedIn={isLoggedIn} />
      </CartProvider>
    </WishlistProvider>
  );
}
