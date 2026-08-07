import { getCategoryTree } from "@/actions/categories.actions";
import { getCartItemCount } from "@/actions/cart.actions";
import { HeaderClient } from "@/components/layout/HeaderClient";

export async function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [categories, cartCount] = await Promise.all([
    getCategoryTree(),
    getCartItemCount(),
  ]);

  return (
    <HeaderClient
      categories={categories}
      isLoggedIn={isLoggedIn}
      cartCount={cartCount}
    />
  );
}
