import { getRelatedProducts } from "@/actions/products.actions";
import { ProductRow } from "@/features/products/components/ProductRow";

export async function RelatedProducts({
  categoryId,
  excludeProductId,
}: {
  categoryId: string;
  excludeProductId: string;
}) {
  const products = await getRelatedProducts(categoryId, excludeProductId);
  return <ProductRow title="You May Also Like" products={products} />;
}
