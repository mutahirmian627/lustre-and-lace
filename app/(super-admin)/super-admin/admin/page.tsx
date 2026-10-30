import type { Metadata } from "next";
import Link from "next/link";
import { listManagedUsers } from "@/actions/super-admin/users.actions";
import { ManagedUsersTable } from "@/features/super-admin/components/ManagedUsersTable";

export const metadata: Metadata = { title: "Super Admin — Admins" };

export default async function SuperAdminAdminsPage() {
  const { users, totalCount } = await listManagedUsers({ role: "admin" });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl text-foreground">Admins</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "admin" : "admins"} besides you. To add one, open{" "}
          <Link href="/super-admin/customers" className="text-primary underline underline-offset-4">
            Customers
          </Link>{" "}
          and choose Make admin.
        </p>
      </div>
      <ManagedUsersTable users={users} mode="admin" />
    </div>
  );
}
