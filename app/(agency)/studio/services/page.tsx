import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { SERVICES } from "@/constants/agency";
import { CtaBand } from "@/features/agency/components/CtaBand";
import { SectionHeading } from "@/features/agency/components/SectionHeading";
import { ServiceIcon } from "@/features/agency/components/ServiceIcon";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Website development, ecommerce, branding, digital marketing and social media, SEO, custom web applications, and AI and business automation for small businesses in Pakistan.",
  alternates: { canonical: "/studio/services" },
};

export default function ServicesPage() {
  return (
    <div>
      <section className="bg-accent">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading
            as="h1"
            eyebrow="Services"
            title="Seven ways we help your business grow online"
            lead="Pick the one you need now. Most clients start with a website or a store, then add branding, marketing and automation as the business grows."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-4 px-4 py-10 sm:space-y-6 sm:px-6 sm:py-16 lg:px-8">
        {SERVICES.map((service) => (
          <article
            key={service.slug}
            className="grid gap-5 rounded-2xl border border-border bg-card p-5 sm:gap-8 sm:p-9 lg:grid-cols-[1fr_1.2fr]"
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 sm:block">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary ring-1 ring-secondary">
                  <ServiceIcon slug={service.slug} className="size-6" />
                </span>
                <h2 className="font-heading text-xl text-foreground sm:mt-4 sm:text-3xl">{service.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:hidden">{service.short}</p>
              <p className="hidden leading-relaxed text-muted-foreground sm:block">{service.intro}</p>
              <Link
                href={`/studio/services/${service.slug}`}
                className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Full details
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            {/* Phones: the list folds away so seven services don't make a very long page. */}
            <details className="group rounded-lg border border-border px-4 py-3 sm:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                What you get
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <ul className="mt-3 space-y-3 text-sm text-foreground/85">
                {service.deliverables.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </details>
            <div className="hidden sm:block">
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">What you get</h3>
              <ul className="mt-4 space-y-3 text-sm text-foreground/85">
                {service.deliverables.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <CtaBand />
    </div>
  );
}
