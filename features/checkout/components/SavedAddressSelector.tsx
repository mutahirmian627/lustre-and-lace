"use client";

import { useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { CheckoutInput } from "@/features/checkout/types";
import type { addresses } from "@/db/schema";

type Address = typeof addresses.$inferSelect;

export function SavedAddressSelector({
  savedAddresses,
  setValue,
}: {
  savedAddresses: Address[];
  setValue: UseFormSetValue<CheckoutInput>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    savedAddresses.find((a) => a.isDefault)?.id ?? null
  );

  if (savedAddresses.length === 0) return null;

  function selectAddress(address: Address) {
    setSelectedId(address.id);
    setValue("fullName", address.fullName);
    setValue("phone", address.phone);
    setValue("addressLine1", address.addressLine1);
    setValue("addressLine2", address.addressLine2 ?? "");
    setValue("city", address.city);
    setValue("province", address.province ?? "");
    setValue("postalCode", address.postalCode ?? "");
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">Use a saved address</span>
      <div className="flex flex-wrap gap-2">
        {savedAddresses.map((address) => (
          <button
            key={address.id}
            type="button"
            onClick={() => selectAddress(address)}
            className={cn(
              "rounded-md border px-3 py-2 text-left text-sm",
              selectedId === address.id ? "border-primary bg-accent" : "border-border"
            )}
          >
            <span className="block font-medium text-foreground">
              {address.label || "Address"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {address.addressLine1}, {address.city}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className={cn(
            "rounded-md border px-3 py-2 text-sm text-foreground",
            selectedId === null ? "border-primary bg-accent" : "border-border"
          )}
        >
          + Add new address
        </button>
      </div>
    </div>
  );
}
