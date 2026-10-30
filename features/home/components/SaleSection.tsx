import Link from "next/link";
import { getSaleProducts } from "@/actions/home.actions";
import { ProductCard } from "@/features/products/components/ProductCard";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/shared/FadeInSection";
import { getDiscountPercent } from "@/utils/discount-percent";

/** Promo panel + the best-discounted pieces. Renders nothing when nothing is actually on sale. */
export async function SaleSection() {
  const products = await getSaleProducts(6);
  if (products.length === 0) return null;

  const biggestDiscount = Math.max(...products.map((p) => getDiscountPercent(p.basePrice, p.compareAtPrice)));

  return (
    <FadeInSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 rounded-2xl bg-accent p-6 sm:p-10 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-12">
        <div className="flex flex-col items-start justify-center gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold-dark">Special offers</p>
          <h2 className="font-heading text-4xl leading-tight text-foreground sm:text-5xl">
            The <em className="font-normal italic text-primary">Sale</em>
          </h2>
          <p className="text-muted-foreground">
            Up to <span className="font-heading text-2xl text-primary">{biggestDiscount}% off</span> on pieces you
            will love.
          </p>
          <Button nativeButton={false} render={<Link href="/sale" />} size="lg" className="mt-2">
            Shop the Sale
          </Button>
        </div>

        <ul className="flex flex-wrap gap-4">
          {products.map((product) => (
            <li
              key={product.id}
              className="basis-[calc(50%-0.5rem)] sm:basis-[calc(33.333%-0.7rem)] lg:basis-[calc(33.333%-0.7rem)]"
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </FadeInSection>
  );
}
