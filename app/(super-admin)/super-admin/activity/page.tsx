import type { Metadata } from "next";
import { getRoleAuditLog } from "@/actions/super-admin/users.actions";
import { DataTable } from "@/features/admin/components/DataTable";
import { RoleBadge } from "@/features/admin/components/RoleBadge";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";

export const metadata: Metadata = { title: "Super Admin — Activity" };

export default async function SuperAdminActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { entries, totalPages } = await getRoleAuditLog({ page });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl text-foreground">Activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every promotion and removal of admin access, newest first.</p>
      </div>
      <DataTable
        rows={entries}
        rowKey={(e) => e.id}
        emptyMessage="No role changes yet."
        columns={[
          {
            header: "When",
            cell: (e) =>
              new Date(e.createdAt).toLocaleString("en-PK", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }),
          },
          { header: "Account", cell: (e) => e.targetEmail },
          {
            header: "Change",
            cell: (e) => (
              <span className="flex items-center gap-2">
                <RoleBadge role={e.fromRole} />
                <span aria-hidden="true">→</span>
                <span className="sr-only">to</span>
                <RoleBadge role={e.toRole} />
              </span>
            ),
          },
          { header: "Done by", cell: (e) => e.actorEmail },
        ]}
      />
      <ProductListPagination basePath="/super-admin/activity" currentParams={params} page={page} totalPages={totalPages} />
    </div>
  );
}
