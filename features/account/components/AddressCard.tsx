"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddressFormDialog } from "@/features/account/components/AddressFormDialog";
import { deleteAddress, setDefaultAddress } from "@/actions/account.actions";
import type { addresses } from "@/db/schema";

type Address = typeof addresses.$inferSelect;

export function AddressCard({ address }: { address: Address }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleDelete() {
    setIsBusy(true);
    const result = await deleteAddress(address.id);
    setIsBusy(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleSetDefault() {
    setIsBusy(true);
    const result = await setDefaultAddress(address.id);
    setIsBusy(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          {address.label && (
            <p className="text-xs font-medium text-muted-foreground">{address.label}</p>
          )}
          <p className="font-medium text-foreground">{address.fullName}</p>
        </div>
        {address.isDefault && <Badge variant="outline">Default</Badge>}
      </div>
      <p className="text-sm text-muted-foreground">{address.phone}</p>
      <p className="text-sm text-muted-foreground">
        {address.addressLine1}
        {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}
        {address.province ? `, ${address.province}` : ""}
        {address.postalCode ? ` ${address.postalCode}` : ""}
      </p>

      <div className="flex flex-wrap gap-2 pt-2">
        <AddressFormDialog
          address={address}
          trigger={
            <Button variant="outline" size="sm">
              <Pencil className="size-3.5" />
              Edit
            </Button>
          }
        />
        {!address.isDefault && (
          <Button variant="outline" size="sm" onClick={handleSetDefault} disabled={isBusy}>
            Set as Default
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleDelete} disabled={isBusy}>
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
