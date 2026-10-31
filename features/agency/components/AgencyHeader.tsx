"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ArrowUpRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Services", href: "/services" },
  { label: "Our work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Demo store", href: "/shop" },
] as const;

export function AgencyHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur transition-shadow",
        scrolled && "shadow-[0_2px_12px_rgb(34_29_29/0.07)]"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-baseline gap-2 leading-none">
          <span className="font-heading text-2xl text-foreground sm:text-[1.7rem]">{BRAND.name}</span>
          <span className="hidden text-[0.65rem] font-medium uppercase tracking-[0.22em] text-gold-dark sm:inline">
            Studio
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive(item.href) ? "text-primary" : "text-foreground/80"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/get-started"
            className={cn(buttonVariants({ size: "lg" }), "hidden h-10 rounded-full px-5 sm:inline-flex")}
          >
            Start a project
            <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
          </Link>

          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="font-heading">{BRAND.name}</SheetTitle>
                </SheetHeader>
                <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 pb-6">
                  {[{ label: "Home", href: "/" }, ...NAV].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-2 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/get-started"
                    onClick={() => setOpen(false)}
                    className={cn(buttonVariants({ size: "lg" }), "mt-4 h-11 rounded-full")}
                  >
                    Start a project
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
