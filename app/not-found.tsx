import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-sans text-sm tracking-widest text-muted-foreground uppercase">
        404
      </p>
      <h1 className="font-heading text-3xl text-foreground">
        This page has slipped away
      </h1>
      <p className="max-w-md text-muted-foreground">
        We couldn&apos;t find what you were looking for. It may have been
        moved, or the link may be out of date.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-2")}>
        Back to Lustre &amp; Lace
      </Link>
    </main>
  );
}
