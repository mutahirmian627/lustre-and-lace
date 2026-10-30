import type { Metadata } from "next";
import { GuestOrderLookupForm } from "@/features/orders/components/GuestOrderLookupForm";

export const metadata: Metadata = { title: "Track Your Order" };

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-3 text-center">
        <h1 className="font-heading text-4xl text-foreground">Track Your Order</h1>
        <span className="mx-auto block h-0.5 w-12 bg-primary" />
        <p className="text-muted-foreground">
          Enter your order reference and the email you used at checkout to see its status.
        </p>
      </header>
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <GuestOrderLookupForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Just need a quick status? Type your order number into the chat button at the bottom right.
      </p>
    </div>
  );
}
