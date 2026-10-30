import { Suspense } from "react";
import { HeroBanner } from "@/features/home/components/HeroBanner";
import { TrustStrip } from "@/features/home/components/TrustStrip";
import { FeaturedCategories } from "@/features/home/components/FeaturedCategories";
import { SaleSection } from "@/features/home/components/SaleSection";
import { NewArrivalsSection } from "@/features/home/components/NewArrivalsSection";
import { TrendingSection } from "@/features/home/components/TrendingSection";
import { BestSellersSection } from "@/features/home/components/BestSellersSection";
import { WeddingCollectionBanner } from "@/features/home/components/WeddingCollectionBanner";
import { ReviewsCarousel } from "@/features/home/components/ReviewsCarousel";
import { InstagramGallery } from "@/features/home/components/InstagramGallery";
import { ProductCardSkeleton } from "@/components/shared/skeletons";
import { OrganizationJsonLd } from "@/components/shared/OrganizationJsonLd";

function ProductRowSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-16 sm:grid-cols-3 sm:px-6 lg:grid-cols-4 lg:px-8">
      {Array.from({ length: 4 }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      <OrganizationJsonLd />
      <HeroBanner />
      <TrustStrip />
      <Suspense fallback={<div className="min-h-[28rem]" aria-hidden="true" />}>
        <FeaturedCategories />
      </Suspense>
      <Suspense fallback={null}>
        <SaleSection />
      </Suspense>
      <Suspense fallback={<ProductRowSkeleton />}>
        <div className="mx-auto max-w-7xl px-4 py-16 empty:hidden sm:px-6 lg:px-8">
          <NewArrivalsSection />
        </div>
      </Suspense>
      <Suspense fallback={<ProductRowSkeleton />}>
        <div className="mx-auto max-w-7xl px-4 py-16 empty:hidden sm:px-6 lg:px-8">
          <TrendingSection />
        </div>
      </Suspense>
      <Suspense fallback={<ProductRowSkeleton />}>
        <div className="mx-auto max-w-7xl px-4 py-16 empty:hidden sm:px-6 lg:px-8">
          <BestSellersSection />
        </div>
      </Suspense>
      <WeddingCollectionBanner />
      <Suspense fallback={null}>
        <ReviewsCarousel />
      </Suspense>
      <InstagramGallery />
    </div>
  );
}
