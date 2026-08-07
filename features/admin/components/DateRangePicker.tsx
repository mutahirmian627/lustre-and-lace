"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DateRangePicker({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", nextFrom);
    params.set("to", nextTo);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        apply(String(formData.get("from")), String(formData.get("to")));
      }}
    >
      <div className="space-y-1">
        <label htmlFor="from" className="text-xs text-muted-foreground">
          From
        </label>
        <Input id="from" name="from" type="date" defaultValue={from} />
      </div>
      <div className="space-y-1">
        <label htmlFor="to" className="text-xs text-muted-foreground">
          To
        </label>
        <Input id="to" name="to" type="date" defaultValue={to} />
      </div>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
