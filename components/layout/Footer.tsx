import Link from "next/link";
import { Camera } from "lucide-react";
import { getTopLevelCategories } from "@/actions/categories.actions";
import { BRAND } from "@/constants/brand";
import { HELP_LINKS } from "@/constants/nav-links";
import { SOCIAL_LINKS } from "@/constants/site-config";

const PAYMENT_PILLS = ["Cash on Delivery", "EasyPaisa", "JazzCash", "Delivery across Pakistan"] as const;

const LINK_CLASS = "transition-colors hover:text-secondary";

export async function Footer() {
  const categories = await getTopLevelCategories();

  return (
    <footer className="mt-8 bg-plum text-plum-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="max-w-sm space-y-4">
            <span className="font-heading text-3xl">{BRAND.name}</span>
            <p className="font-heading text-base italic text-secondary">{BRAND.storeTagline}</p>
            <p className="text-sm font-light leading-relaxed text-plum-foreground/75">
              Elegant, affordable artificial jewellery for every story you&apos;re telling, from everyday wear to your
              biggest moments.
            </p>
            <Link
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-plum-foreground/30 px-4 py-2 text-sm transition-colors hover:border-secondary hover:text-secondary"
            >
              <Camera className="size-4" aria-hidden="true" />
              Follow us on Instagram
            </Link>
          </div>

          <nav aria-label="Shop">
            <h3 className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em] text-secondary">Shop</h3>
            <ul className="space-y-2.5 text-sm font-light text-plum-foreground/85">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/shop/categories/${category.slug}`} className={LINK_CLASS}>
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop/sale" className={LINK_CLASS}>
                  Sale
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Help">
            <h3 className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em] text-secondary">Help</h3>
            <ul className="space-y-2.5 text-sm font-light text-plum-foreground/85">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="border-t border-plum-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 pb-20 text-xs text-plum-foreground/75 sm:px-6 sm:pb-5 sm:pr-24 md:flex-row lg:px-8 lg:pr-24">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.name}. A demo store by{" "}
            <Link href="/studio" className="underline underline-offset-2 transition-colors hover:text-secondary">
              {BRAND.name} Studio
            </Link>
            .
          </p>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Payment and delivery">
            {PAYMENT_PILLS.map((pill) => (
              <li key={pill} className="rounded-full border border-plum-foreground/25 px-3 py-1 text-plum-foreground">
                {pill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
