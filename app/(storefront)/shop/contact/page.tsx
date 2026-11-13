import type { Metadata } from "next";
import Link from "next/link";
import { Camera, HelpCircle, MessageCircle, PackageSearch, Phone } from "lucide-react";
import { getSetting } from "@/lib/settings";
import { SETTINGS_KEYS } from "@/constants/settings-keys";
import { SOCIAL_LINKS } from "@/constants/site-config";
import { buildWhatsAppChatLink, isRealWhatsAppNumber } from "@/services/whatsapp.service";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Chat with our team, message us on WhatsApp, or find quick answers.",
  alternates: { canonical: "/shop/contact" },
};

interface ContactOption {
  icon: typeof MessageCircle;
  title: string;
  description: string;
  action: React.ReactNode;
}

const linkClassName =
  "inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary";

export default async function ContactPage() {
  const whatsappNumber = await getSetting(SETTINGS_KEYS.whatsappBusinessNumber);

  const options: ContactOption[] = [
    {
      icon: MessageCircle,
      title: "Chat with our team",
      description:
        "Use the chat button at the bottom right of any page. Get instant answers, check an order's status, or message us directly once you're signed in.",
      action: <span className="text-sm text-muted-foreground">Look for the round button in the corner.</span>,
    },
    ...(isRealWhatsAppNumber(whatsappNumber)
      ? [
          {
            icon: Phone,
            title: "WhatsApp",
            description: "Message us directly. This is also where to send payment screenshots and start a return.",
            action: (
              <a href={buildWhatsAppChatLink(whatsappNumber)} target="_blank" rel="noopener noreferrer" className={linkClassName}>
                Message us on WhatsApp
              </a>
            ),
          },
        ]
      : []),
    {
      icon: PackageSearch,
      title: "Where's my order?",
      description: "Enter your order number and email to see its status.",
      action: (
        <Link href="/shop/track-order" className={linkClassName}>
          Track an order
        </Link>
      ),
    },
    {
      icon: HelpCircle,
      title: "Quick answers",
      description: "Delivery times, payment methods and returns, answered.",
      action: (
        <Link href="/shop/policies/faq" className={linkClassName}>
          Read the FAQs
        </Link>
      ),
    },
    {
      icon: Camera,
      title: "Instagram",
      description: "See new arrivals and how customers style their pieces.",
      action: (
        <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          Follow us
        </a>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary">Help</p>
        <h1 className="font-heading text-4xl text-foreground">We&apos;d love to hear from you</h1>
        <span className="mx-auto block h-0.5 w-12 bg-primary" />
        <p className="mx-auto max-w-xl text-muted-foreground">
          Questions about a piece, an order, or a return? Pick whichever way suits you best.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {options.map(({ icon: Icon, title, description, action }) => (
          <li key={title} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="font-heading text-xl text-foreground">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <div className="mt-auto">{action}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
