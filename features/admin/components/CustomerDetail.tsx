"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/features/account/components/OrderCard";
import { promoteToAdmin, demoteToCustomer } from "@/actions/admin/customers.actions";
import type { getCustomerDetail } from "@/actions/admin/customers.actions";

type CustomerDetailData = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;

export function CustomerDetail({ data }: { data: CustomerDetailData }) {
  const router = useRouter();
  const { user, orders, addresses } = data;

  async function handlePromote() {
    const result = await promoteToAdmin(user.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Promoted to admin.");
    router.refresh();
  }

  async function handleDemote() {
    const result = await demoteToCustomer(user.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Demoted to customer.");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground">
            {user.email}
            {user.phone ? ` · ${user.phone}` : ""}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
            {user.emailVerified ? (
              <Badge variant="outline" className="border-success text-success">
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Unverified</Badge>
            )}
          </div>
        </div>
        {user.role === "admin" ? (
          <Button variant="outline" onClick={handleDemote}>
            Demote to Customer
          </Button>
        ) : (
          <Button variant="outline" onClick={handlePromote}>
            Promote to Admin
          </Button>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-heading text-lg text-foreground">Order History</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-heading text-lg text-foreground">Saved Addresses</h3>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved addresses.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className="space-y-1 rounded-lg border border-border p-4">
                {address.label && <p className="text-xs font-medium text-muted-foreground">{address.label}</p>}
                <p className="font-medium text-foreground">{address.fullName}</p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}
                  {address.province ? `, ${address.province}` : ""}
                  {address.postalCode ? ` ${address.postalCode}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
