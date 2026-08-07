"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-sans text-sm tracking-widest text-muted-foreground uppercase">
        Something went wrong
      </p>
      <h1 className="font-heading text-3xl text-foreground">
        A small hiccup on our end
      </h1>
      <p className="max-w-md text-muted-foreground">
        Please try again in a moment. If this keeps happening, reach out and
        we&apos;ll take a look.
      </p>
      <Button className="mt-2" onClick={() => reset()}>
        Try again
      </Button>
    </main>
  );
}
