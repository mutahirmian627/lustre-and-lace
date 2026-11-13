import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { getAddresses } from "@/actions/account.actions";
import { AddressCard } from "@/features/account/components/AddressCard";
import { AddressFormDialog } from "@/features/account/components/AddressFormDialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "My Addresses" };

export default async function AddressesPage() {
  const addresses = await getAddresses();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-foreground">My Addresses</h1>
        {addresses.length > 0 && (
          <AddressFormDialog trigger={<Button>+ Add New Address</Button>} />
        )}
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses yet"
          description="Add an address to speed through checkout next time."
        >
          <AddressFormDialog trigger={<Button className="mt-2">+ Add New Address</Button>} />
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard key={address.id} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
