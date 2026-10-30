import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/shared/FadeInSection";
import { WEDDING_COLLECTION_BANNER } from "@/constants/site-config";

export function WeddingCollectionBanner() {
  return (
    <FadeInSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative isolate flex min-h-[380px] items-center justify-center overflow-hidden rounded-2xl bg-plum">
        {WEDDING_COLLECTION_BANNER.imageUrl ? (
          <>
            <Image src={WEDDING_COLLECTION_BANNER.imageUrl} alt="" fill className="-z-10 object-cover" />
            <div className="absolute inset-0 -z-10 bg-plum/60" />
          </>
        ) : (
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgb(244_198_207/0.22)_0%,transparent_70%)]" />
            <div className="absolute -left-20 top-1/2 size-80 -translate-y-1/2 rounded-full border border-gold/40" />
            <div className="absolute -right-20 top-1/2 size-80 -translate-y-1/2 rounded-full border border-gold/40" />
            <Sparkles className="absolute left-[14%] top-[22%] size-5 text-gold/70" />
            <Sparkles className="absolute bottom-[24%] right-[16%] size-6 text-gold/70" />
          </div>
        )}
        <div className="max-w-lg px-6 py-12 text-center text-plum-foreground">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-champagne">Bridal &amp; occasion</p>
          <h2 className="font-heading text-3xl sm:text-4xl">{WEDDING_COLLECTION_BANNER.headline}</h2>
          <p className="mt-3 font-light text-plum-foreground/80">{WEDDING_COLLECTION_BANNER.subtext}</p>
          <Button
            nativeButton={false}
            render={<Link href={WEDDING_COLLECTION_BANNER.ctaHref} />}
            className="mt-7 bg-secondary text-secondary-foreground hover:bg-blush-light"
            size="lg"
          >
            {WEDDING_COLLECTION_BANNER.ctaLabel}
          </Button>
        </div>
      </div>
    </FadeInSection>
  );
}
