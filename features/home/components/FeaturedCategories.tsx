import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getFeaturedCategories } from "@/actions/home.actions";
import { HoverLift } from "@/components/shared/HoverLift";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeInSection } from "@/components/shared/FadeInSection";

export async function FeaturedCategories() {
  const categories = await getFeaturedCategories();
  if (categories.length === 0) return null;

  return (
    <FadeInSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading title="Shop by Category" align="center" className="mb-10" />
      {/* Flex-wrap + centered rows so a short last row sits in the middle instead of leaving a gap on the right. */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {categories.map((category) => (
          <HoverLift
            key={category.id}
            className="basis-[calc(50%-0.375rem)] rounded-xl sm:basis-[calc(33.333%-0.75rem)] lg:basis-[calc(20%-0.8rem)]"
          >
            <Link
              href={`/categories/${category.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br from-secondary via-accent to-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {category.imageUrl && (
                <>
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                  />
                </>
              )}

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 p-4 text-center">
                <span
                  className={
                    category.imageUrl
                      ? "font-heading text-lg tracking-wide text-white sm:text-xl"
                      : "font-heading text-lg tracking-wide text-foreground sm:text-xl"
                  }
                >
                  {category.name}
                </span>
                <span
                  className={
                    category.imageUrl
                      ? "inline-flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-white/85 transition-all group-hover:gap-2"
                      : "inline-flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-primary transition-all group-hover:gap-2"
                  }
                >
                  Shop now
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </HoverLift>
        ))}
      </div>
    </FadeInSection>
  );
}
