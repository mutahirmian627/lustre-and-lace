import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_BANNER, WEDDING_COLLECTION_BANNER } from "@/constants/site-config";

/**
 * Server component on purpose: the headline is the LCP element, and gating it
 * behind a client-side opacity animation made it invisible until JS hydrated.
 * The entrance motion is CSS-only and never hides the text.
 */
export function HeroBanner() {
  return (
    <section className="relative isolate flex min-h-[34rem] items-center overflow-hidden bg-accent py-16 sm:min-h-[38rem]">
      {HERO_BANNER.imageUrl ? (
        <div className="hero-zoom absolute inset-0 -z-10">
          <Image
            src={HERO_BANNER.imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-background/40" />
        </div>
      ) : (
        <HeroBackdrop />
      )}

      <div className="hero-rise relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="mb-5 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-primary sm:tracking-[0.3em]">
          <span className="h-px w-8 bg-primary/50 max-sm:hidden" aria-hidden="true" />
          Artificial jewellery boutique
          <span className="h-px w-8 bg-primary/50 max-sm:hidden" aria-hidden="true" />
        </p>
        <h1 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
          <EditorialHeadline text={HERO_BANNER.headline} emphasis="Sparkle" />
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{HERO_BANNER.subtext}</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            render={<Link href={HERO_BANNER.ctaHref} />}
            size="lg"
            className="w-full sm:w-auto sm:min-w-48"
          >
            {HERO_BANNER.ctaLabel}
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={WEDDING_COLLECTION_BANNER.ctaHref} />}
            variant="outline"
            size="lg"
            className="w-full bg-background/60 sm:w-auto sm:min-w-48"
          >
            Wedding Collection
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Sets one word in italic rose for the editorial feel; falls back to plain text if the word isn't there. */
function EditorialHeadline({ text, emphasis }: { text: string; emphasis: string }) {
  const [before, after] = text.split(emphasis);
  if (after === undefined) return <>{text}</>;
  return (
    <>
      {before}
      <em className="font-normal italic text-primary">{emphasis}</em>
      {after}
    </>
  );
}

/** Decorative only — soft light, interlocking rings and a few sparkles, so the hero reads as jewellery without needing a photo. */
function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_0%,var(--secondary)_0%,transparent_70%)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(40%_50%_at_90%_90%,var(--secondary)_0%,transparent_70%)] opacity-50" />

      <div className="absolute -left-24 top-1/2 size-[26rem] -translate-y-1/2 rounded-full border border-primary/20 sm:-left-16" />
      <div className="absolute -left-4 top-1/2 size-[26rem] -translate-y-1/2 rounded-full border border-primary/15 max-sm:hidden" />
      <div className="absolute -right-24 top-1/2 size-[26rem] -translate-y-1/2 rounded-full border border-primary/20 sm:-right-16" />
      <div className="absolute -right-4 top-1/2 size-[26rem] -translate-y-1/2 rounded-full border border-primary/15 max-sm:hidden" />

      <Sparkles className="absolute left-[12%] top-[18%] size-6 text-primary/40" />
      <Sparkles className="absolute right-[14%] top-[26%] size-4 text-primary/30" />
      <Sparkles className="absolute bottom-[20%] left-[20%] size-4 text-primary/30 max-sm:hidden" />
      <Sparkles className="absolute bottom-[16%] right-[22%] size-6 text-primary/40" />
    </div>
  );
}
