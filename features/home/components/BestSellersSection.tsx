import { getBestSellers } from "@/actions/home.actions";
import { ProductRow } from "@/features/products/components/ProductRow";

export async function BestSellersSection() {
  const products = await getBestSellers();
  return (
    <ProductRow title="Best Sellers" viewAllHref="/shop/products?sort=best_selling" products={products} />
  );
}
