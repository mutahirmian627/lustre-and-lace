import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CASE_STUDY } from "@/constants/agency";
import { APERIONIE_APPARELS, APERIONIE_FOODS } from "@/features/immersive/work";
import { BrowserFrame } from "@/features/agency/components/BrowserFrame";
import { PhoneFrame } from "@/features/agency/components/PhoneFrame";
import { CtaBand } from "@/features/agency/components/CtaBand";
import { SectionHeading } from "@/features/agency/components/SectionHeading";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Three projects you can open and try: the Aperionie Adornments demo store, Aperionie Foods (3D food ordering) and Aperionie Apparels (a 3D fashion lookbook). All three are our own demos, built to show the standard of our work.",
  alternates: { canonical: "/studio/work" },
};

// The browser mockup is lazy-loaded and only shown from 640px up; this hint starts its download early
// for those screens without making phones fetch it.
const WORK_DESKTOP = getImageProps({
  src: "/agency/adornments-category.jpg",
  alt: "",
  width: 1440,
  height: 900,
  sizes: "(min-width: 1024px) 640px, 90vw",
}).props;

/** One project on the page: who it is, where to open it, and the screens that show it. */
interface Project {
  kind: string;
  name: string;
  summary: string;
  stack: readonly string[];
  /** The solid button, then the quiet link. */
  open: { label: string; href: string; external?: boolean };
  ask: { label: string; href: string };
  desktop: { src: string; alt: string };
  /** The phone laid over the browser from 640px up, and the two phones side by side below that. */
  overlayPhone: { src: string; alt: string };
  phones: [{ src: string; alt: string }, { src: string; alt: string }];
  /** The cards under the project: lists of what it does. */
  cards: { title: string; items: readonly string[] }[];
}

const ask = (service: string) => `/studio/get-started?service=${service}`;

const PROJECTS: Project[] = [
  {
    kind: CASE_STUDY.kind,
    name: CASE_STUDY.name,
    summary: CASE_STUDY.summary,
    stack: CASE_STUDY.stack,
    open: { label: "Open the demo store", href: "/shop" },
    ask: { label: "I want a store like this", href: ask("ecommerce") },
    desktop: { src: "/agency/adornments-category.jpg", alt: "A product category in the demo store" },
    overlayPhone: { src: "/agency/adornments-mobile.jpg", alt: "The demo store on a phone" },
    phones: [
      { src: "/agency/adornments-mobile-product.jpg", alt: "A product page in the demo store, on a phone" },
      { src: "/agency/adornments-mobile.jpg", alt: "A product category in the demo store, on a phone" },
    ],
    cards: [
      { title: "What your customers get", items: CASE_STUDY.storeFeatures },
      { title: "What you get to run it", items: CASE_STUDY.adminFeatures },
    ],
  },
  {
    kind: APERIONIE_FOODS.kind,
    name: APERIONIE_FOODS.name,
    summary: APERIONIE_FOODS.summary,
    stack: APERIONIE_FOODS.stack,
    open: { label: "Open the site", href: APERIONIE_FOODS.url, external: true },
    ask: { label: "I want something like this", href: ask(APERIONIE_FOODS.serviceSlug) },
    desktop: { src: APERIONIE_FOODS.shots.desktop, alt: "The Aperionie Foods home page, a 3D pizza, in a browser" },
    overlayPhone: { src: APERIONIE_FOODS.shots.phone, alt: "Aperionie Foods on a phone" },
    phones: [
      { src: APERIONIE_FOODS.shots.phone, alt: "The Aperionie Foods home page, on a phone" },
      { src: APERIONIE_FOODS.shots.phone2, alt: "The Aperionie Foods menu, on a phone" },
    ],
    cards: [{ title: "What it does", items: APERIONIE_FOODS.features }],
  },
  {
    kind: APERIONIE_APPARELS.kind,
    name: APERIONIE_APPARELS.name,
    summary: APERIONIE_APPARELS.summary,
    stack: APERIONIE_APPARELS.stack,
    open: { label: "Open the site", href: APERIONIE_APPARELS.url, external: true },
    ask: { label: "I want something like this", href: ask(APERIONIE_APPARELS.serviceSlug) },
    desktop: { src: APERIONIE_APPARELS.shots.desktop, alt: "Aperionie Apparels: nine looks on a circular 3D runway, in a browser" },
    overlayPhone: { src: APERIONIE_APPARELS.shots.phone, alt: "Aperionie Apparels on a phone" },
    phones: [
      { src: APERIONIE_APPARELS.shots.phone, alt: "The Aperionie Apparels runway, on a phone" },
      { src: APERIONIE_APPARELS.shots.phone2, alt: "A single look in Aperionie Apparels, on a phone" },
    ],
    cards: [{ title: "What it does", items: APERIONIE_APPARELS.features }],
  },
];

function ProjectSection({ project, index }: { project: Project; index: number }) {
  const external = project.open.external;
  const buttonClass = cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-7");
  const buttonContent = (
    <>
      {project.open.label}
      <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </>
  );
  const reverse = index % 2 === 1;

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8" aria-labelledby={`project-${index}`}>
        <div
          className={cn(
            "grid items-start gap-8 sm:gap-10 lg:gap-14",
            reverse ? "lg:grid-cols-[1.1fr_1fr]" : "lg:grid-cols-[1fr_1.1fr]"
          )}
        >
          <div className={cn("space-y-5 sm:space-y-6", reverse && "lg:order-2")}>
            <span className="inline-flex items-center rounded-full bg-champagne px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-plum">
              {project.kind}
            </span>
            <h2 id={`project-${index}`} className="font-heading text-3xl text-foreground sm:text-4xl">
              {project.name}
            </h2>
            <p className="leading-relaxed text-muted-foreground">{project.summary}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {external ? (
                <a href={project.open.href} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                  {buttonContent}
                </a>
              ) : (
                <Link href={project.open.href} className={buttonClass}>
                  {buttonContent}
                </Link>
              )}
              <Link
                href={project.ask.href}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 rounded-full px-7")}
              >
                {project.ask.label}
              </Link>
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-gold-dark">Built with</h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {project.stack.map((item) => (
                  <li key={item} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/80">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Phones: two real screens side by side. */}
          <div className="mx-auto flex w-full max-w-xs items-start justify-center gap-3 sm:hidden">
            <PhoneFrame src={project.phones[0].src} alt={project.phones[0].alt} sizes="160px" className="w-1/2" />
            <PhoneFrame src={project.phones[1].src} alt={project.phones[1].alt} sizes="160px" className="mt-8 w-1/2" />
          </div>

          <div className={cn("relative hidden sm:block", reverse && "lg:order-1")}>
            <BrowserFrame
              src={project.desktop.src}
              alt={project.desktop.alt}
              url={`${project.name} · demo project`}
              className="border-border"
              priority={index === 0}
            />
            <div
              className={cn(
                "absolute -bottom-6 hidden w-[24%] overflow-hidden rounded-[1.5rem] border-[5px] border-[#1c1517] bg-background shadow-[0_24px_50px_-12px_rgb(0_0_0/0.45)] sm:block",
                reverse ? "-left-2 lg:-left-6" : "-right-2 lg:-right-6"
              )}
            >
              <Image
                src={project.overlayPhone.src}
                alt={project.overlayPhone.alt}
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
        <div
          className={cn(
            "mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:gap-10 sm:px-6 sm:py-16 lg:px-8",
            project.cards.length > 1 && "lg:grid-cols-2"
          )}
        >
          {project.cards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-border bg-card p-5 sm:p-9">
              <h3 className="font-heading text-xl text-foreground">{card.title}</h3>
              <ul
                className={cn(
                  "mt-5 space-y-3 text-sm text-foreground/85",
                  project.cards.length === 1 && "lg:grid lg:grid-cols-2 lg:gap-x-12 lg:space-y-0 lg:gap-y-3"
                )}
              >
                {card.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

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
            title="Three projects you can actually open and use"
            lead="We'd rather show you real software than a slide deck. These are the projects we built to prove what we can deliver: an online store, a 3D food-ordering site and a 3D fashion lookbook. All three are our own demos, and you can open every one."
          />
        </div>
      </section>

      {PROJECTS.map((project, index) => (
        <ProjectSection key={project.name} project={project} index={index} />
      ))}

      <section className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-16 lg:px-8">
        <h2 className="font-heading text-2xl text-foreground sm:text-3xl">Your project could be next</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          These are our own projects, and we&apos;ll add client work here as we finish it, with permission. Until then,
          they are the honest measure of what we build.
        </p>
      </section>

      <CtaBand />
    </div>
  );
}
