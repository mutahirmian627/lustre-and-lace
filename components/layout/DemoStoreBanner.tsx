import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { BRAND } from "@/constants/brand";

/**
 * Always-visible honesty strip on every store page: the shop is a demo project that shows what the
 * studio builds, not a business selling jewellery to the public.
 */
export function DemoStoreBanner() {
  return (
    <div className="border-b border-border bg-champagne text-xs text-plum">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2 sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-primary">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {BRAND.name} Studio
        </Link>
        <p className="text-center">
          <span className="font-semibold uppercase tracking-[0.14em]">Live demo store</span>
          <span className="hidden sm:inline"> — built by us to show what your online store could look like.</span>
        </p>
        <Link
          href="/get-started"
          className="inline-flex items-center gap-1 font-semibold text-plum underline underline-offset-2 transition-colors hover:text-primary"
        >
          Get a store like this
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
