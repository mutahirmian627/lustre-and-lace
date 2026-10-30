import type { Metadata } from "next";
import { listManagedUsers } from "@/actions/super-admin/users.actions";
import { ManagedUsersTable } from "@/features/super-admin/components/ManagedUsersTable";
import { CustomersSearchBar } from "@/features/admin/components/CustomersSearchBar";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";

export const metadata: Metadata = { title: "Super Admin — Customers" };

export default async function SuperAdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { users, totalCount, totalPages } = await listManagedUsers({ role: "customer", search: params.search, page });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl text-foreground">Customers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "customer" : "customers"}
          {params.search ? ` matching “${params.search}”` : ""}. Only verified accounts can be made admins.
        </p>
      </div>
      <CustomersSearchBar />
      <ManagedUsersTable users={users} mode="customer" />
      <ProductListPagination basePath="/super-admin/customers" currentParams={params} page={page} totalPages={totalPages} />
    </div>
  );
}
