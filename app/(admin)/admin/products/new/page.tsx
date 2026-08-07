import type { Metadata } from "next";
import { getAllCategoriesForSelect } from "@/actions/admin/products.actions";
import { ProductForm } from "@/features/admin/components/ProductForm";

export const metadata: Metadata = { title: "New Product" };

export default async function NewProductPage() {
  const categories = await getAllCategoriesForSelect();

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-foreground">New Product</h2>
      <ProductForm categories={categories} />
    </div>
  );
}
