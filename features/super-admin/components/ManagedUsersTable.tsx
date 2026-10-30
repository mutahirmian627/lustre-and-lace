import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/features/admin/components/DataTable";
import { RoleActionButton } from "@/features/super-admin/components/RoleActionButton";
import type { ManagedUserRow } from "@/actions/super-admin/users.actions";

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-PK", DATE) : "Never";
}

export function ManagedUsersTable({ users, mode }: { users: ManagedUserRow[]; mode: "customer" | "admin" }) {
  return (
    <DataTable
      rows={users}
      rowKey={(u) => u.id}
      emptyMessage={mode === "admin" ? "No admins yet. Promote a customer to add one." : "No customers found."}
      columns={[
        { header: "Name", cell: (u) => <span className="font-medium text-foreground">{u.name}</span> },
        { header: "Email", cell: (u) => u.email },
        { header: "Phone", cell: (u) => u.phone ?? "—" },
        { header: "Joined", cell: (u) => formatDate(u.createdAt) },
        { header: "Last active", cell: (u) => formatDate(u.lastActiveAt) },
        ...(mode === "customer" ? [{ header: "Orders", cell: (u: ManagedUserRow) => u.totalOrders }] : []),
        {
          header: "Email",
          cell: (u) =>
            u.emailVerified ? (
              <Badge variant="outline" className="border-success text-success">
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Unverified</Badge>
            ),
        },
        {
          header: "Actions",
          cell: (u) => (
            <div className="flex flex-wrap gap-2">
              {mode === "customer" ? (
                u.emailVerified ? (
                  <RoleActionButton kind="promote" userId={u.id} name={u.name} />
                ) : null
              ) : (
                <RoleActionButton kind="demote" userId={u.id} name={u.name} />
              )}
              <RoleActionButton kind="signout" userId={u.id} name={u.name} variant="ghost" />
            </div>
          ),
        },
      ]}
    />
  );
}
