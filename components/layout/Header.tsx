import { getCategoryTree } from "@/actions/categories.actions";
import { HeaderClient } from "@/components/layout/HeaderClient";

export async function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const categories = await getCategoryTree();

  return <HeaderClient categories={categories} isLoggedIn={isLoggedIn} />;
}
