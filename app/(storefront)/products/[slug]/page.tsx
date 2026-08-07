import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getProductBySlug } from "@/actions/products.actions";
import { ProductDetailClient } from "@/features/products/components/ProductDetailClient";
import { ReviewsTab } from "@/features/products/components/ReviewsTab";
import { RelatedProducts } from "@/features/products/components/RelatedProducts";
import { RecentlyViewed } from "@/features/products/components/RecentlyViewed";
import { RecordView } from "@/features/products/components/RecordView";
import { ProductCardSkeleton } from "@/components/shared/skeletons";
import { SITE_POLICIES } from "@/constants/site-config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BreadcrumbJsonLd } from "@/components/shared/BreadcrumbJsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];

  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: primaryImage ? { images: [primaryImage.url] } : undefined,
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { slug } = await params;
  const { orderId } = await searchParams;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((img) => img.url),
    offers: {
      "@type": "Offer",
      price: defaultVariant?.price ?? product.basePrice,
      priceCurrency: "PKR",
      availability:
        totalStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(product.reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.ratingAverage,
        reviewCount: product.reviews.length,
      },
    }),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: product.category.name, path: `/categories/${product.category.slug}` },
          { name: product.name, path: `/products/${product.slug}` },
        ]}
      />
      <RecordView slug={product.slug} />

      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/">Home</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/categories/${product.category.slug}`}>{product.category.name}</Link>}
            />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="sr-only">{product.name}</h1>
      <ProductDetailClient
        productId={product.id}
        productName={product.name}
        productImages={product.images}
        variants={product.variants}
      />

      <Accordion
        defaultValue={orderId ? ["description", "reviews"] : ["description"]}
        className="mt-12 max-w-3xl"
      >
        <AccordionItem value="description">
          <AccordionTrigger className="font-heading text-lg">Description</AccordionTrigger>
          <AccordionContent>
            {product.description ?? "No description available."}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shipping">
          <AccordionTrigger className="font-heading text-lg">Shipping Info</AccordionTrigger>
          <AccordionContent className="whitespace-pre-line">
            {SITE_POLICIES.shipping}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="returns">
          <AccordionTrigger className="font-heading text-lg">Return Policy</AccordionTrigger>
          <AccordionContent className="whitespace-pre-line">
            {SITE_POLICIES.returns}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="reviews" id="reviews">
          <AccordionTrigger className="font-heading text-lg">
            Reviews ({product.reviews.length})
          </AccordionTrigger>
          <AccordionContent>
            <ReviewsTab
              productId={product.id}
              productSlug={product.slug}
              orderId={orderId}
              reviews={product.reviews}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-16 space-y-16">
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <RelatedProducts categoryId={product.categoryId} excludeProductId={product.id} />
        </Suspense>
        <RecentlyViewed excludeSlug={product.slug} />
      </div>
    </div>
  );
}
