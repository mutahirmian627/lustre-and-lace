import Link from "next/link";
import Image from "next/image";
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.map((category) => (
          <HoverLift key={category.id}>
            <Link href={`/categories/${category.slug}`} className="block text-center">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-heading text-lg text-muted-foreground">
                    {category.name}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{category.name}</p>
            </Link>
          </HoverLift>
        ))}
      </div>
    </FadeInSection>
  );
}
