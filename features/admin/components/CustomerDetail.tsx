"use client";

import { Badge } from "@/components/ui/badge";
import { OrderCard } from "@/features/account/components/OrderCard";
import { RoleBadge } from "@/features/admin/components/RoleBadge";
import type { getCustomerDetail } from "@/actions/admin/customers.actions";

type CustomerDetailData = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;

export function CustomerDetail({ data }: { data: CustomerDetailData }) {
  const { user, orders, addresses } = data;

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
            <RoleBadge role={user.role} />
            {user.emailVerified ? (
              <Badge variant="outline" className="border-success text-success">
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Unverified</Badge>
            )}
          </div>
        </div>
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
