import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductForEdit, getAllCategoriesForSelect } from "@/actions/admin/products.actions";
import { ProductForm } from "@/features/admin/components/ProductForm";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductForEdit(id),
    getAllCategoriesForSelect(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-foreground">Edit Product</h2>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
