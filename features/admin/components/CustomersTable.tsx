"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/features/admin/components/DataTable";
import { promoteToAdmin, demoteToCustomer, type AdminCustomerRow } from "@/actions/admin/customers.actions";
import { formatCurrency } from "@/utils/format-currency";

export function CustomersTable({ customers }: { customers: AdminCustomerRow[] }) {
  const router = useRouter();

  async function handlePromote(id: string) {
    const result = await promoteToAdmin(id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Promoted to admin.");
    router.refresh();
  }

  async function handleDemote(id: string) {
    const result = await demoteToCustomer(id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Demoted to customer.");
    router.refresh();
  }

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
          cell: (c) => (
            <Badge variant={c.role === "admin" ? "default" : "outline"}>{c.role}</Badge>
          ),
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
        {
          header: "Actions",
          cell: (c) =>
            c.role === "admin" ? (
              <Button variant="outline" size="sm" onClick={() => handleDemote(c.id)}>
                Demote to Customer
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handlePromote(c.id)}>
                Promote to Admin
              </Button>
            ),
        },
      ]}
    />
  );
}
