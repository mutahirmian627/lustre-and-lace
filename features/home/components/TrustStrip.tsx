import { Banknote, MessageCircle, RotateCcw, Truck } from "lucide-react";

// Every claim here is already stated in SITE_POLICIES / the checkout flow, so the strip can't promise more than the site does.
const ITEMS = [
  { icon: Truck, title: "Delivery in 3-5 days", detail: "Across Pakistan" },
  { icon: Banknote, title: "Cash on Delivery", detail: "Available nationwide" },
  { icon: RotateCcw, title: "7-day returns", detail: "On unworn items" },
  { icon: MessageCircle, title: "We're here to help", detail: "Chat with our team" },
] as const;

export function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="border-y border-border bg-background">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
        {ITEMS.map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-plum">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{title}</span>
              <span className="block text-xs text-muted-foreground">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
