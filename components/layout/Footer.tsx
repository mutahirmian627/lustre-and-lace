import Link from "next/link";
import { Camera } from "lucide-react";
import { getTopLevelCategories } from "@/actions/categories.actions";
import { BRAND } from "@/constants/brand";
import { HELP_LINKS } from "@/constants/nav-links";
import { SOCIAL_LINKS } from "@/constants/site-config";

export async function Footer() {
  const categories = await getTopLevelCategories();

  return (
    <footer className="border-t border-border bg-accent">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div className="space-y-3">
            <span className="font-heading text-2xl text-foreground">{BRAND.name}</span>
            <p className="text-sm text-muted-foreground">{BRAND.tagline}</p>
            <p className="text-sm text-muted-foreground">
              Elegant, affordable jewellery for every story you&apos;re telling.
            </p>
            <Link
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Instagram"
              className="inline-flex text-muted-foreground hover:text-primary"
            >
              <Camera className="size-5" />
            </Link>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-foreground">Shop</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.slug}`} className="hover:text-primary">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-foreground">Help</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
        <p className="mt-1">
          We accept Cash on Delivery and Bank Transfer (EasyPaisa / JazzCash).
        </p>
      </div>
    </footer>
  );
}
