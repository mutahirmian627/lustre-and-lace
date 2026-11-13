import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PROCESS_STEPS, SERVICES, getService } from "@/constants/agency";
import { CtaBand } from "@/features/agency/components/CtaBand";
import { ServiceIcon } from "@/features/agency/components/ServiceIcon";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.short,
    alternates: { canonical: `/studio/services/${service.slug}` },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const others = SERVICES.filter((item) => item.slug !== service.slug);

  return (
    <div>
      <section className="bg-plum text-plum-foreground">
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-10 sm:space-y-6 sm:px-6 sm:py-20 lg:px-8">
          <Link href="/studio/services" className="inline-block text-sm text-plum-foreground/70 transition-colors hover:text-secondary">
            &larr; All services
          </Link>
          <span className="flex size-12 items-center justify-center rounded-xl bg-plum-foreground/10 text-secondary">
            <ServiceIcon slug={service.slug} className="size-6" />
          </span>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold-light">{service.title}</p>
          <h1 className="max-w-3xl font-heading text-4xl leading-tight sm:text-5xl">{service.headline}</h1>
          <p className="max-w-2xl text-base font-light leading-relaxed text-plum-foreground/80 sm:text-lg">{service.intro}</p>
          <Link
            href={`/studio/get-started?service=${service.slug}`}
            className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-8 max-sm:w-full")}
          >
            Get a quote
            <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-[1.4fr_1fr] lg:px-8">
        <div>
          <h2 className="font-heading text-2xl text-foreground">What you get</h2>
          <ul className="mt-5 space-y-3.5 text-[0.95rem] text-foreground/85 sm:mt-6 sm:space-y-4 sm:text-base">
            {service.deliverables.map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-accent p-5 sm:p-7">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">Great for</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-foreground/85">
            {service.goodFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {service.slug === "ecommerce" && (
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              See it in our demo store
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </aside>
      </section>

      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <h2 className="font-heading text-2xl text-foreground">How a project runs</h2>
          <ol className="mt-6 grid gap-0 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-5">
            {PROCESS_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative flex gap-4 pb-6 last:pb-0 max-sm:before:absolute max-sm:before:bottom-0 max-sm:before:left-[1.1rem] max-sm:before:top-11 max-sm:before:w-px max-sm:before:bg-secondary max-sm:last:before:hidden sm:block sm:pb-0"
              >
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm text-primary-foreground sm:size-auto sm:bg-transparent sm:text-3xl sm:text-primary"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-heading text-base text-foreground sm:mt-1">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:mt-1.5">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <h2 className="font-heading text-2xl text-foreground">Other services</h2>
        <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
          {others.map((item) => (
            <Link
              key={item.slug}
              href={`/studio/services/${item.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <ServiceIcon slug={item.slug} className="size-5 text-primary" />
              <h3 className="mt-3 font-heading text-base text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.short}</p>
            </Link>
          ))}
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
