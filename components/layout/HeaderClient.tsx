"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, User, ShoppingBag, X } from "lucide-react";
import { SearchOverlay } from "@/features/products/components/SearchOverlay";
import { useWishlist } from "@/features/wishlist/context/WishlistProvider";
import { useCart } from "@/features/cart/context/CartProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { BRAND } from "@/constants/brand";
import { ANNOUNCEMENT_BAR_TEXT } from "@/constants/site-config";
import { cn } from "@/lib/utils";
import type { getCategoryTree } from "@/actions/categories.actions";

type CategoryTree = Awaited<ReturnType<typeof getCategoryTree>>;

const NAV_LINK_CLASS =
  "relative py-3 text-xs font-medium uppercase tracking-[0.16em] text-foreground transition-colors after:absolute after:inset-x-0 after:bottom-2 after:h-px after:origin-center after:scale-x-0 after:bg-primary after:transition-transform hover:text-primary hover:after:scale-x-100 motion-reduce:after:transition-none";

export function HeaderClient({
  categories,
  isLoggedIn,
}: {
  categories: CategoryTree;
  isLoggedIn: boolean;
}) {
  const { count: wishlistCount } = useWishlist();
  const { cart, openDrawer } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-30">
      {!announcementDismissed && (
        <div className="flex items-center justify-center gap-3 bg-plum px-4 py-2 text-center text-xs tracking-wide text-plum-foreground">
          <span>{ANNOUNCEMENT_BAR_TEXT}</span>
          <button
            type="button"
            onClick={() => setAnnouncementDismissed(true)}
            aria-label="Dismiss announcement"
            className="text-plum-foreground/70 transition-colors hover:text-plum-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Only paint changes on scroll (never size): a height change would shift the page under
          the scroll position and make the header flicker around the threshold. */}
      <header
        className={cn(
          "border-b border-border bg-background transition-shadow",
          scrolled && "shadow-[0_2px_12px_rgb(34_29_29/0.07)]"
        )}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <MobileNav
                categories={categories}
                isLoggedIn={isLoggedIn}
                wishlistCount={wishlistCount}
              />
            </div>
            <div className="hidden items-center gap-5 text-xs tracking-[0.08em] text-muted-foreground md:flex">
              <Link href="/shop/track-order" className="transition-colors hover:text-primary">
                Track order
              </Link>
              <Link href="/shop/contact" className="transition-colors hover:text-primary">
                Contact
              </Link>
            </div>
          </div>

          <Link
            href="/shop"
            className="text-center font-heading text-2xl leading-none text-foreground sm:text-3xl"
          >
            {BRAND.name}
          </Link>

          <div className="flex items-center justify-end gap-1">
            <SearchOverlay />
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              aria-label="Wishlist"
              className="hidden md:inline-flex relative"
              render={<Link href="/shop/wishlist" />}
            >
              <Heart className="size-5" />
              {wishlistCount > 0 && <IconBadge count={wishlistCount} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              aria-label={isLoggedIn ? "Account" : "Sign in"}
              className="hidden md:inline-flex"
              render={<Link href={isLoggedIn ? "/shop/account" : "/shop/login"} />}
            >
              <User className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cart"
              className="relative"
              onClick={openDrawer}
            >
              <ShoppingBag className="size-5" />
              {cart.itemCount > 0 && <IconBadge count={cart.itemCount} />}
            </Button>
          </div>
        </div>

        <nav
          aria-label="Shop by category"
          className="hidden items-center justify-center gap-9 border-t border-border/70 px-4 md:flex"
        >
          {categories.map((category) =>
            category.children.length > 0 ? (
              <DropdownMenu key={category.id}>
                <DropdownMenuTrigger className={NAV_LINK_CLASS}>{category.name}</DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {category.children.map((child) => (
                    <DropdownMenuItem
                      key={child.id}
                      render={<Link href={`/shop/categories/${child.slug}`}>{child.name}</Link>}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link key={category.id} href={`/shop/categories/${category.slug}`} className={NAV_LINK_CLASS}>
                {category.name}
              </Link>
            )
          )}
          <Link href="/shop/sale" className={cn(NAV_LINK_CLASS, "font-semibold text-primary")}>
            Sale
          </Link>
        </nav>
      </header>
    </div>
  );
}

function IconBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
      {count > 9 ? "9+" : count}
    </span>
  );
}
