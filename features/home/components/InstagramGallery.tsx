import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeInSection } from "@/components/shared/FadeInSection";
import { INSTAGRAM_GALLERY } from "@/constants/site-config";

export function InstagramGallery() {
  if (INSTAGRAM_GALLERY.length === 0) return null;

  return (
    <FadeInSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading title="Instagram-Worthy" align="center" className="mb-10" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {INSTAGRAM_GALLERY.map((item, index) => {
          const image = (
            <div className="relative aspect-square overflow-hidden rounded-md">
              <Image
                src={item.imageUrl}
                alt=""
                fill
                sizes="16vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          );
          return item.postUrl ? (
            <Link key={index} href={item.postUrl} target="_blank" rel="noopener noreferrer">
              {image}
            </Link>
          ) : (
            <div key={index}>{image}</div>
          );
        })}
      </div>
    </FadeInSection>
  );
}
