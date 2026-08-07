import type { Metadata } from "next";
import { GuestOrderLookupForm } from "@/features/orders/components/GuestOrderLookupForm";

export const metadata: Metadata = { title: "Track Your Order" };

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-heading text-3xl text-foreground">Track Your Order</h1>
      <p className="mb-8 text-muted-foreground">
        Enter your order reference and the email you used at checkout to see its status.
      </p>
      <GuestOrderLookupForm />
    </div>
  );
}
