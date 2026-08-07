import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCategoryTree } from "@/actions/categories.actions";
import { getWishlistCount } from "@/actions/home.actions";
import { getCartItemCount } from "@/actions/cart.actions";
import { HeaderClient } from "@/components/layout/HeaderClient";

export async function Header() {
  const [categories, session, wishlistCount, cartCount] = await Promise.all([
    getCategoryTree(),
    auth.api.getSession({ headers: await headers() }),
    getWishlistCount(),
    getCartItemCount(),
  ]);

  return (
    <HeaderClient
      categories={categories}
      isLoggedIn={!!session?.user}
      wishlistCount={wishlistCount}
      cartCount={cartCount}
    />
  );
}
