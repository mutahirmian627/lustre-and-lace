import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CASE_STUDY } from "@/constants/agency";
import { BrowserFrame } from "@/features/agency/components/BrowserFrame";
import { PhoneFrame } from "@/features/agency/components/PhoneFrame";
import { CtaBand } from "@/features/agency/components/CtaBand";
import { SectionHeading } from "@/features/agency/components/SectionHeading";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "See the Lustre & Lace demo store: a complete online store with checkout, payments and an admin panel, built to show the standard of our work.",
  alternates: { canonical: "/work" },
};

// The browser mockup is lazy-loaded and only shown from 640px up; this hint starts its download early
// for those screens without making phones fetch it.
const WORK_DESKTOP = getImageProps({
  src: "/agency/store-category.jpg",
  alt: "",
  width: 1440,
  height: 900,
  sizes: "(min-width: 1024px) 640px, 90vw",
}).props;

export default function WorkPage() {
  return (
    <div>
      <link
        rel="preload"
        as="image"
        imageSrcSet={WORK_DESKTOP.srcSet}
        imageSizes={WORK_DESKTOP.sizes}
        media="(min-width: 640px)"
        fetchPriority="high"
      />
      <section className="bg-accent">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8">
          <SectionHeading
            eyebrow="Our work"
            title="One finished project you can actually use"
            lead="We'd rather show you real software than a slide deck. This is the store we built to prove what we can deliver."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid items-start gap-8 sm:gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div className="space-y-5 sm:space-y-6">
            <span className="inline-flex items-center rounded-full bg-champagne px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-plum">
              {CASE_STUDY.kind}
            </span>
            <h2 className="font-heading text-3xl text-foreground sm:text-4xl">{CASE_STUDY.name}</h2>
            <p className="leading-relaxed text-muted-foreground">{CASE_STUDY.summary}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-7")}>
                Open the demo store
                <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
              </Link>
              <Link
                href="/get-started?service=ecommerce"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-full px-7")}
              >
                I want a store like this
              </Link>
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">Built with</h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {CASE_STUDY.stack.map((item) => (
                  <li key={item} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/80">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Phones: two real screens of the store side by side. */}
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

          <div className="relative hidden sm:block">
            <BrowserFrame
              src="/agency/store-category.jpg"
              alt="A product category in the demo store"
              url="lustreandlace.com/categories/necklaces"
              className="border-border"
            />
            <div className="absolute -bottom-6 -right-2 hidden w-[24%] overflow-hidden rounded-[1.5rem] border-[5px] border-[#1c1517] bg-background shadow-[0_24px_50px_-12px_rgb(0_0_0/0.45)] sm:block lg:-right-6">
              <Image
                src="/agency/store-mobile.jpg"
                alt="The demo store on a phone"
                width={390}
                height={844}
                className="h-auto w-full"
                sizes="150px"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-9">
            <h3 className="font-heading text-xl text-foreground">What your customers get</h3>
            <ul className="mt-5 space-y-3 text-sm text-foreground/85">
              {CASE_STUDY.storeFeatures.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-9">
            <h3 className="font-heading text-xl text-foreground">What you get to run it</h3>
            <ul className="mt-5 space-y-3 text-sm text-foreground/85">
              {CASE_STUDY.adminFeatures.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-16 lg:px-8">
        <h2 className="font-heading text-2xl text-foreground sm:text-3xl">Your project could be next</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          This is the first project on this page, and we&apos;ll add client work here as we finish it, with permission.
          Until then, the demo store is the honest measure of what we build.
        </p>
      </section>

      <CtaBand />
    </div>
  );
}
