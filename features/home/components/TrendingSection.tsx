import { getTrendingProducts } from "@/actions/home.actions";
import { ProductRow } from "@/features/products/components/ProductRow";

export async function TrendingSection() {
  const products = await getTrendingProducts();
  return <ProductRow title="Trending Now" viewAllHref="/products" products={products} />;
}
