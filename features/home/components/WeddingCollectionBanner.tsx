import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/shared/FadeInSection";
import { WEDDING_COLLECTION_BANNER } from "@/constants/site-config";

export function WeddingCollectionBanner() {
  return (
    <FadeInSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl bg-secondary">
        {WEDDING_COLLECTION_BANNER.imageUrl && (
          <Image
            src={WEDDING_COLLECTION_BANNER.imageUrl}
            alt=""
            fill
            className="object-cover"
          />
        )}
        <div className="relative z-10 max-w-lg px-6 text-center">
          <h2 className="font-heading text-3xl text-foreground sm:text-4xl">
            {WEDDING_COLLECTION_BANNER.headline}
          </h2>
          <p className="mt-3 text-secondary-foreground/80">
            {WEDDING_COLLECTION_BANNER.subtext}
          </p>
          <Button
            nativeButton={false}
            render={<Link href={WEDDING_COLLECTION_BANNER.ctaHref} />}
            className="mt-6"
            size="lg"
          >
            {WEDDING_COLLECTION_BANNER.ctaLabel}
          </Button>
        </div>
      </div>
    </FadeInSection>
  );
}
