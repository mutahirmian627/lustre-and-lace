import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HERO_BANNER } from "@/constants/site-config";

/**
 * Server component on purpose: the headline is the LCP element, and gating it
 * behind a client-side opacity animation made it invisible until JS hydrated.
 * The entrance motion is CSS-only and never hides the text.
 */
export function HeroBanner() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-accent">
      {HERO_BANNER.imageUrl && (
        <div className="hero-zoom absolute inset-0">
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
      )}

      <div className="hero-rise relative z-10 mx-auto max-w-2xl px-6 text-center">
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">
          {HERO_BANNER.headline}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{HERO_BANNER.subtext}</p>
        <Button
          nativeButton={false}
          render={<Link href={HERO_BANNER.ctaHref} />}
          className="mt-8"
          size="lg"
        >
          {HERO_BANNER.ctaLabel}
        </Button>
      </div>
    </section>
  );
}
