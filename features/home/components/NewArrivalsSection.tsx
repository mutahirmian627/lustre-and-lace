import { getNewArrivals } from "@/actions/home.actions";
import { ProductRow } from "@/features/products/components/ProductRow";

export async function NewArrivalsSection() {
  const products = await getNewArrivals();
  return <ProductRow title="New Arrivals" viewAllHref="/shop/products?sort=newest" products={products} />;
}
