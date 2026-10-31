import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Closing call to action repeated at the bottom of the studio pages. */
export function CtaBand({
  title = "Your business has potential. Let's take it online.",
  body = "Tell us what you're selling and who you want to reach. We'll reply with honest advice and a clear quote. No commitment.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-plum px-6 py-14 text-center text-plum-foreground sm:px-12">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold-light">Let&apos;s build something</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl leading-tight sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-plum-foreground/75">{body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/get-started" className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-8")}>
            Start your project
            <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
          </Link>
          <Link
            href="/shop"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 rounded-full border-plum-foreground/30 bg-transparent px-8 text-plum-foreground hover:bg-plum-foreground/10 hover:text-plum-foreground"
            )}
          >
            Try the demo store
          </Link>
        </div>
      </div>
    </section>
  );
}
