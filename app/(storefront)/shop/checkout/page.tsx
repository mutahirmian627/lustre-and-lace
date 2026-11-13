import type { Metadata } from "next";
import { getSavedAddresses } from "@/actions/addresses.actions";
import { CheckoutPageClient } from "@/features/checkout/components/CheckoutPageClient";
import { requireSessionOrRedirect } from "@/lib/session";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  await requireSessionOrRedirect();
  const savedAddresses = await getSavedAddresses();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-3xl text-foreground">Checkout</h1>
      <CheckoutPageClient savedAddresses={savedAddresses} />
    </div>
  );
}
