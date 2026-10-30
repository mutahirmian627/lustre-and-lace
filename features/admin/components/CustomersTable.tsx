"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/features/admin/components/DataTable";
import type { AdminCustomerRow } from "@/actions/admin/customers.actions";
import { RoleBadge } from "@/features/admin/components/RoleBadge";
import { formatCurrency } from "@/utils/format-currency";

export function CustomersTable({ customers }: { customers: AdminCustomerRow[] }) {
  return (
    <DataTable
      rows={customers}
      rowKey={(c) => c.id}
      emptyMessage="No customers found."
      columns={[
        {
          header: "Name",
          cell: (c) => (
            <Link href={`/admin/customers/${c.id}`} className="text-primary hover:underline">
              {c.name}
            </Link>
          ),
        },
        { header: "Email", cell: (c) => c.email },
        { header: "Phone", cell: (c) => c.phone ?? "—" },
        {
          header: "Role",
          cell: (c) => <RoleBadge role={c.role} />,
        },
        {
          header: "Joined",
          cell: (c) => new Date(c.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
        },
        { header: "Orders", cell: (c) => c.totalOrders },
        { header: "Total Spent", cell: (c) => formatCurrency(c.totalSpent) },
        {
          header: "Verified",
          cell: (c) =>
            c.emailVerified ? (
              <Badge variant="outline" className="border-success text-success">
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Unverified</Badge>
            ),
        },
      ]}
    />
  );
}
