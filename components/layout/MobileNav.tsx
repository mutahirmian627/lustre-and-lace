"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Heart, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { getCategoryTree } from "@/actions/categories.actions";

type CategoryTree = Awaited<ReturnType<typeof getCategoryTree>>;

export function MobileNav({
  categories,
  isLoggedIn,
  wishlistCount,
}: {
  categories: CategoryTree;
  isLoggedIn: boolean;
  wishlistCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4 pb-6">
          {categories.map((category) => (
            <div key={category.id} className="py-2">
              <Link
                href={`/shop/categories/${category.slug}`}
                onClick={() => setOpen(false)}
                className="font-medium text-foreground"
              >
                {category.name}
              </Link>
              {category.children.length > 0 && (
                <div className="ml-3 mt-1 flex flex-col gap-1">
                  {category.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/shop/categories/${child.slug}`}
                      onClick={() => setOpen(false)}
                      className="py-1 text-sm text-muted-foreground"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Link
            href="/shop/sale"
            onClick={() => setOpen(false)}
            className="py-2 font-semibold text-primary"
          >
            Sale
          </Link>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <Link
              href="/shop/wishlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <Heart className="size-4" />
              Wishlist
              {wishlistCount > 0 && (
                <span className="text-muted-foreground">({wishlistCount})</span>
              )}
            </Link>
            <Link
              href={isLoggedIn ? "/shop/account" : "/shop/login"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <User className="size-4" />
              {isLoggedIn ? "My Account" : "Sign In"}
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
