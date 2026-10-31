"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Phone-only bar pinned to the bottom of the studio pages once the visitor has scrolled past the
 * first screen, so "Start a project" is always one tap away. Hidden on the form page itself.
 */
export function MobileCtaBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 520);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/get-started") return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur transition-transform duration-300 md:hidden motion-reduce:transition-none",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!visible}
    >
      <Link
        href="/get-started"
        tabIndex={visible ? 0 : -1}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-colors active:bg-primary/80"
      >
        Start your project
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
