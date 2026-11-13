import type { Metadata } from "next";
import Link from "next/link";
import Image, { getImageProps } from "next/image";
import { ArrowRight, ArrowUpRight, Banknote, Check, ChevronRight, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BRAND } from "@/constants/brand";
import { AGENCY_FAQS, DIFFERENTIATORS, PACKAGES, PROCESS_STEPS, SERVICES } from "@/constants/agency";
import { SOCIAL_LINKS } from "@/constants/site-config";
import { BrowserFrame } from "@/features/agency/components/BrowserFrame";
import { PhoneFrame } from "@/features/agency/components/PhoneFrame";
import { CtaBand } from "@/features/agency/components/CtaBand";
import { SectionHeading } from "@/features/agency/components/SectionHeading";
import { ServiceIcon } from "@/features/agency/components/ServiceIcon";
import { cn } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`;

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} | ${BRAND.descriptor}` },
  description:
    "We build professional websites and online stores for small businesses in Pakistan, and help them grow with social media and advertising. See our live demo store.",
  alternates: { canonical: "/studio" },
};

const TRUST_ITEMS = ["Cash on Delivery", "EasyPaisa & JazzCash", "WhatsApp ordering", "Mobile-first", "PKR pricing"];

// The hero shows a browser mockup from 640px up and a phone mockup below it. Each is lazy-loaded, so
// these media-scoped hints are what start the right download early and keep the other one off the wire.
const HERO_DESKTOP = getImageProps({
  src: "/agency/store-category.jpg",
  alt: "",
  width: 1440,
  height: 900,
  sizes: "(min-width: 1024px) 640px, 90vw",
}).props;
const HERO_PHONE = getImageProps({ src: "/agency/store-mobile.jpg", alt: "", width: 390, height: 844, sizes: "240px" }).props;

export default function StudioHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: BRAND.name,
    description: BRAND.descriptor,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    areaServed: "PK",
    sameAs: [SOCIAL_LINKS.instagram],
    makesOffer: SERVICES.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service.title, description: service.short },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <link
        rel="preload"
        as="image"
        imageSrcSet={HERO_DESKTOP.srcSet}
        imageSizes={HERO_DESKTOP.sizes}
        media="(min-width: 640px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        imageSrcSet={HERO_PHONE.srcSet}
        imageSizes={HERO_PHONE.sizes}
        media="(max-width: 639px)"
        fetchPriority="high"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-plum text-plum-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 size-[34rem] rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-gold/15 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pt-10 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:py-24">
          <div className="max-w-xl space-y-5 sm:space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-plum-foreground/20 px-3.5 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-secondary sm:text-xs sm:tracking-[0.18em]">
              <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
              <span className="sm:hidden">Web &amp; digital studio</span>
              <span className="hidden sm:inline">Web development &amp; digital marketing</span>
            </p>
            <h1 className="font-heading text-[2.45rem] leading-[1.06] sm:text-5xl sm:leading-[1.08] lg:text-[3.4rem]">
              We help businesses <em className="text-secondary not-italic">go digital</em> and grow online.
            </h1>
            <p className="text-base font-light leading-relaxed text-plum-foreground/80 sm:hidden">
              Websites, online stores and marketing for small businesses in Pakistan.
            </p>
            <p className="hidden text-lg font-light leading-relaxed text-plum-foreground/80 sm:block">
              Professional websites and online stores, plus the social media and advertising to bring customers in.
              Built for small businesses in Pakistan, and shown working in the store below.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Link href="/studio/get-started" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-8")}>
                Start your project
                <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
              </Link>
              <Link
                href="/shop"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 rounded-full border-plum-foreground/30 bg-transparent px-8 text-plum-foreground hover:bg-plum-foreground/10 hover:text-plum-foreground",
                  // On phones the second action is a quiet text link, so there is one clear button to tap.
                  "max-sm:h-10 max-sm:border-0 max-sm:px-0 max-sm:text-[0.7rem] max-sm:underline max-sm:underline-offset-4 max-sm:hover:bg-transparent"
                )}
              >
                <span className="sm:hidden">Or try the demo store</span>
                <span className="hidden sm:inline">Try the demo store</span>
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-plum-foreground/70 sm:pt-2">
              {["Free quote", "No commitment", "Clear plain-language advice"].map((item, index) => (
                <li key={item} className={cn("items-center gap-1.5", index === 2 ? "hidden sm:flex" : "flex")}>
                  <Check className="size-4 text-gold-light" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Phones: the store as it looks in a hand, with two proof chips. */}
          <div className="relative mx-auto h-[26rem] w-full max-w-[21rem] overflow-hidden sm:hidden">
            <PhoneFrame
              src="/agency/store-mobile.jpg"
              alt="The Lustre & Lace demo store on a phone"
              sizes="240px"
              className="absolute inset-x-14 top-2"
            />
            <span className="absolute left-0 top-6 flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1.5 text-[0.7rem] font-medium text-plum shadow-lg">
              <Banknote className="size-3.5 text-primary" aria-hidden="true" />
              Cash on Delivery
            </span>
            <span className="absolute right-0 top-44 flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1.5 text-[0.7rem] font-medium text-plum shadow-lg">
              <LayoutDashboard className="size-3.5 text-primary" aria-hidden="true" />
              Admin panel included
            </span>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-plum via-plum/70 to-transparent" />
          </div>

          <div className="relative mx-auto hidden w-full max-w-xl sm:block lg:max-w-none">
            <BrowserFrame
              src="/agency/store-category.jpg"
              alt="A product category in the Lustre & Lace demo store, shown in a browser"
              url="lustreandlace.com/categories/necklaces"
            />
            <div className="absolute -bottom-8 -left-2 hidden w-[26%] overflow-hidden rounded-[1.6rem] border-[5px] border-[#1c1517] bg-background shadow-[0_24px_50px_-12px_rgb(0_0_0/0.55)] sm:block lg:-left-8">
              <Image
                src="/agency/store-mobile.jpg"
                alt="The same demo store on a phone"
                width={390}
                height={844}
                className="h-auto w-full"
                sizes="160px"
              />
            </div>
          </div>
        </div>

        <div className="relative border-t border-plum-foreground/10">
          <ul tabIndex={0} aria-label="What our stores support" className="mx-auto flex max-w-7xl snap-x items-center gap-x-8 gap-y-2 overflow-x-auto px-4 py-4 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-plum-foreground/65 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:px-6 sm:text-xs lg:px-8 [&::-webkit-scrollbar]:hidden">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="shrink-0 snap-start whitespace-nowrap">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="What we do"
          title="Everything a small business needs to sell online"
          lead="Start with the one thing you need most. Each service stands on its own, and they work even better together."
        />
        <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-5">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              href={`/studio/services/${service.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all active:bg-accent sm:flex-col sm:items-stretch sm:gap-0 sm:p-7 sm:hover:-translate-y-0.5 sm:hover:border-primary/40 sm:hover:shadow-[0_18px_40px_-24px_rgb(78_56_68/0.35)]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary ring-1 ring-secondary sm:size-11">
                <ServiceIcon slug={service.slug} className="size-5" />
              </span>
              <div className="min-w-0 flex-1 sm:flex sm:flex-col">
                <h3 className="font-heading text-lg text-foreground sm:mt-5 sm:text-xl">{service.title}</h3>
                <p className="mt-0.5 text-[0.8rem] leading-snug text-muted-foreground sm:mt-2 sm:flex-1 sm:text-sm sm:leading-relaxed">
                  {service.short}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground sm:hidden" aria-hidden="true" />
              <ul className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
                {service.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {tag}
                  </li>
                ))}
              </ul>
              <span className="mt-5 hidden items-center gap-1 text-sm font-medium text-primary sm:inline-flex">
                Learn more
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Demo proof */}
      <section className="bg-accent">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="space-y-6">
            <SectionHeading
              align="left"
              eyebrow="Proof, not promises"
              title="Don't take our word for it. Open the store."
              lead="Lustre & Lace Store is a complete online store we built to show the standard of our work. Browse it, add a product to the cart and place a test order. It's a demo, so nothing real is sold."
            />
            <ul className="space-y-3 text-sm text-foreground/85">
              {[
                "Catalogue, search, cart and checkout that work on a phone",
                "Cash on Delivery, EasyPaisa and JazzCash payment options",
                "An admin panel to run products, stock and orders",
                "Branded emails, order tracking and live chat support",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link href="/shop" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-7")}>
                Open the demo store
                <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
              </Link>
              <Link
                href="/studio/work"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-full px-7")}
              >
                How it was built
              </Link>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-xs items-start justify-center gap-3 sm:hidden">
            <PhoneFrame
              src="/agency/store-mobile-product.jpg"
              alt="A product page in the demo store, on a phone"
              sizes="160px"
              className="w-1/2"
            />
            <PhoneFrame
              src="/agency/store-mobile.jpg"
              alt="A product category in the demo store, on a phone"
              sizes="160px"
              className="mt-8 w-1/2"
            />
          </div>
          <BrowserFrame
            src="/agency/store-product.jpg"
            alt="A product page in the demo store"
            url="lustreandlace.com/products/velvet-pearl-choker"
            className="hidden border-border sm:block"
          />
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="How we work"
          title="From first chat to first customers"
          lead="A clear process with a quote up front, so you always know what happens next."
        />
        <ol className="mt-8 grid gap-0 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
          {PROCESS_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="relative flex gap-4 pb-7 last:pb-0 max-sm:before:absolute max-sm:before:bottom-0 max-sm:before:left-[1.1rem] max-sm:before:top-11 max-sm:before:w-px max-sm:before:bg-secondary max-sm:last:before:hidden sm:block sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-6"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm text-primary-foreground sm:size-auto sm:bg-transparent sm:text-4xl sm:text-primary"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-heading text-lg text-foreground sm:mt-3">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:mt-2">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Why us */}
      <section className="bg-plum text-plum-foreground">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading tone="dark" eyebrow="Why Lustre & Lace" title="Built around how your customers actually shop" />
          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-plum-foreground/10 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map((item) => (
              <div key={item.title} className="bg-plum p-5 sm:p-7">
                <h3 className="font-heading text-lg text-secondary">{item.title}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-plum-foreground/80">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeading
          eyebrow="Where to start"
          title="Three ways to begin"
          lead="Every project is scoped to your business, so there's no price list. Tell us what you need and you'll get a clear written quote before any work starts."
        />
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-4 [scrollbar-width:none] sm:-mx-6 sm:mt-10 sm:px-6 lg:mx-0 lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0 lg:py-0 [&::-webkit-scrollbar]:hidden">
          {PACKAGES.map((pack) => {
            const featured = "featured" in pack && pack.featured;
            return (
              <div
                key={pack.name}
                className={cn(
                  "relative flex min-w-[82%] snap-center flex-col rounded-2xl border p-6 sm:min-w-[22rem] sm:p-7 lg:min-w-0",
                  featured && "max-lg:order-first",
                  featured ? "border-primary bg-accent shadow-[0_18px_40px_-24px_rgb(175_80_113/0.5)]" : "border-border bg-card"
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="font-heading text-xl text-foreground">{pack.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{pack.forWho}</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-foreground/85">
                  {pack.includes.map((item) => (
                    <li key={item} className="flex gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/studio/get-started?service=${pack.serviceSlug}`}
                  className={cn(
                    buttonVariants({ variant: featured ? "default" : "outline", size: "lg" }),
                    "mt-8 h-11 rounded-full"
                  )}
                >
                  Get a quote
                </Link>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground lg:hidden">Swipe to see all three &rarr;</p>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Advertising spend is paid to the ad platforms directly and is separate from our fee.
        </p>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-4 sm:px-6 sm:pb-8 lg:px-8">
        <SectionHeading eyebrow="Questions" title="Things people ask before they start" />
        <Accordion className="mt-8 rounded-xl border border-border bg-card px-4 sm:mt-10 sm:px-6">
          {AGENCY_FAQS.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <CtaBand />
    </div>
  );
}
