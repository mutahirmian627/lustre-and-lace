import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveFaqs } from "@/lib/support-queries";
import { getFlatShippingRate } from "@/lib/settings";
import { SITE_POLICIES } from "@/constants/site-config";
import { formatCurrency } from "@/utils/format-currency";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PAGES = {
  shipping: { title: "Shipping Info", intro: "How and when your order reaches you." },
  returns: { title: "Return Policy", intro: "What to do if something isn't quite right." },
  faq: { title: "Frequently Asked Questions", intro: "Quick answers to what customers ask most." },
} as const;

type PolicySlug = keyof typeof PAGES;

function isPolicySlug(slug: string): slug is PolicySlug {
  return slug in PAGES;
}

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isPolicySlug(slug)) return {};
  return {
    title: PAGES[slug].title,
    description: PAGES[slug].intro,
    alternates: { canonical: `/policies/${slug}` },
  };
}

/** Policy copy lives in SITE_POLICIES as hard-wrapped text; collapse the wraps so it reflows. */
const toParagraph = (text: string) => text.replace(/\s+/g, " ").trim();

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPolicySlug(slug)) notFound();
  const page = PAGES[slug];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary">Help</p>
        <h1 className="font-heading text-4xl text-foreground">{page.title}</h1>
        <span className="mx-auto block h-0.5 w-12 bg-primary" />
        <p className="text-muted-foreground">{page.intro}</p>
      </header>

      {slug === "shipping" && <ShippingContent />}
      {slug === "returns" && (
        <div className="rounded-xl border border-border bg-card p-6 leading-relaxed text-foreground sm:p-8">
          {toParagraph(SITE_POLICIES.returns)}
        </div>
      )}
      {slug === "faq" && <FaqContent />}

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Still have a question?{" "}
        <Link href="/contact" className="text-primary underline underline-offset-4 hover:no-underline">
          Get in touch
        </Link>
        .
      </p>
    </div>
  );
}

async function ShippingContent() {
  const rate = await getFlatShippingRate();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-6 leading-relaxed text-foreground sm:p-8">
        {toParagraph(SITE_POLICIES.shipping)}
      </div>
      <div className="rounded-xl bg-accent p-6 text-center sm:p-8">
        <p className="text-sm text-muted-foreground">Shipping is a flat rate on every order</p>
        <p className="mt-1 font-heading text-3xl text-primary">{formatCurrency(rate)}</p>
      </div>
    </div>
  );
}

async function FaqContent() {
  const faqs = await getActiveFaqs();

  if (faqs.length === 0) {
    return <p className="text-center text-muted-foreground">No questions yet. Check back soon.</p>;
  }

  return (
    <Accordion className="rounded-xl border border-border bg-card px-6">
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger className="text-base">{faq.question}</AccordionTrigger>
          <AccordionContent className="leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
