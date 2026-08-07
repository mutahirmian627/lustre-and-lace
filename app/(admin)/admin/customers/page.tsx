import type { Metadata } from "next";
import { getAdminCustomers } from "@/actions/admin/customers.actions";
import { CustomersTable } from "@/features/admin/components/CustomersTable";
import { CustomersSearchBar } from "@/features/admin/components/CustomersSearchBar";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";

export const metadata: Metadata = { title: "Admin — Customers" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { customers, totalPages } = await getAdminCustomers({ search: params.search, page });

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-foreground">Customers</h2>
      <CustomersSearchBar />
      <CustomersTable customers={customers} />
      <ProductListPagination basePath="/admin/customers" currentParams={params} page={page} totalPages={totalPages} />
    </div>
  );
}
