import type { Metadata } from "next";
import { BRAND } from "@/constants/brand";
import { CtaBand } from "@/features/agency/components/CtaBand";
import { SectionHeading } from "@/features/agency/components/SectionHeading";

export const metadata: Metadata = {
  title: "About",
  description: "Lustre & Lace is a small web development and digital marketing studio helping businesses in Pakistan go online.",
  alternates: { canonical: "/studio/about" },
};

const PRINCIPLES = [
  {
    title: "Honest by default",
    body: "We won't invent reviews, client logos or sales numbers. If something is a demo, we label it as a demo, including our own store.",
  },
  {
    title: "Plain language",
    body: "You shouldn't need to learn technical terms to hire us. We explain the options, recommend one, and tell you why.",
  },
  {
    title: "Built to last",
    body: "We use modern, well-supported tools so your site stays fast and secure, and so anyone can maintain it later.",
  },
  {
    title: "Your success is the goal",
    body: "A website that nobody visits has failed. That's why we also help with the marketing that brings customers to it.",
  },
] as const;

export default function AboutPage() {
  return (
    <div>
      <section className="bg-plum text-plum-foreground">
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:space-y-5 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold-light">About</p>
          <h1 className="font-heading text-4xl leading-tight sm:text-5xl">
            A small studio that helps businesses get online.
          </h1>
          <p className="max-w-2xl text-base font-light leading-relaxed text-plum-foreground/80 sm:text-lg">
            {BRAND.name} designs and builds websites and online stores, and helps small businesses in Pakistan find
            customers on social media. We started by building our own demo store from scratch, so every promise on this
            site is something you can open and try.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-5 text-base leading-relaxed text-foreground/85">
          <h2 className="font-heading text-2xl text-foreground">Why we do this</h2>
          <p>
            Many good businesses in Pakistan still run on chat messages and handwritten orders. A proper website or
            store, with Cash on Delivery, EasyPaisa and JazzCash, WhatsApp support and a way to manage orders, lets an
            owner serve more customers with less effort.
          </p>
          <p>
            We keep projects focused. You tell us what the business needs, and we recommend the smallest thing that does
            the job well, then help you grow it step by step.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-accent">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeading eyebrow="How we think" title="Four principles we work by" />
          <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-5">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-5 sm:p-7">
                <h3 className="font-heading text-lg text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
