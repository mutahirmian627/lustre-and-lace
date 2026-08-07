import type { Metadata } from "next";
import Link from "next/link";
import { getAdminProducts, getAllCategoriesForSelect } from "@/actions/admin/products.actions";
import { ProductsTable } from "@/features/admin/components/ProductsTable";
import { ProductsFilterBar } from "@/features/admin/components/ProductsFilterBar";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin — Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoryId?: string; status?: "active" | "inactive"; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ products, totalPages }, categories] = await Promise.all([
    getAdminProducts({ search: params.search, categoryId: params.categoryId, status: params.status, page }),
    getAllCategoriesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-foreground">Products</h2>
        <Link href="/admin/products/new">
          <Button>+ New Product</Button>
        </Link>
      </div>

      <ProductsFilterBar categories={categories} />

      <ProductsTable products={products} />

      <ProductListPagination
        basePath="/admin/products"
        currentParams={params}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
