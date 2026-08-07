"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, User, ShoppingBag, X } from "lucide-react";
import { SearchOverlay } from "@/features/products/components/SearchOverlay";
import { useWishlist } from "@/features/wishlist/context/WishlistProvider";
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

export function HeaderClient({
  categories,
  isLoggedIn,
  cartCount,
}: {
  categories: CategoryTree;
  isLoggedIn: boolean;
  cartCount: number;
}) {
  const { count: wishlistCount } = useWishlist();
  const [shrunk, setShrunk] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShrunk(window.scrollY > 48);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-30">
      {!announcementDismissed && (
        <div className="flex items-center justify-center gap-3 bg-secondary px-4 py-1.5 text-center text-xs text-secondary-foreground">
          <span>{ANNOUNCEMENT_BAR_TEXT}</span>
          <button
            type="button"
            onClick={() => setAnnouncementDismissed(true)}
            aria-label="Dismiss announcement"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <header className="border-b border-border bg-background">
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-[padding] sm:px-6 lg:px-8",
            shrunk ? "py-2.5" : "py-4"
          )}
        >
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav
              categories={categories}
              isLoggedIn={isLoggedIn}
              wishlistCount={wishlistCount}
            />
          </div>

          <Link href="/" className="font-heading text-2xl text-foreground">
            {BRAND.name}
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {categories.map((category) =>
              category.children.length > 0 ? (
                <DropdownMenu key={category.id}>
                  <DropdownMenuTrigger className="text-sm font-medium text-foreground hover:text-primary">
                    {category.name}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {category.children.map((child) => (
                      <DropdownMenuItem
                        key={child.id}
                        render={
                          <Link href={`/categories/${child.slug}`}>{child.name}</Link>
                        }
                      />
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  {category.name}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-1">
            <SearchOverlay />
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              aria-label="Wishlist"
              className="hidden md:inline-flex relative"
              render={<Link href="/wishlist" />}
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
              render={<Link href={isLoggedIn ? "/account" : "/login"} />}
            >
              <User className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              aria-label="Cart"
              className="relative"
              render={<Link href="/cart" />}
            >
              <ShoppingBag className="size-5" />
              {cartCount > 0 && <IconBadge count={cartCount} />}
            </Button>
          </div>
        </div>
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
