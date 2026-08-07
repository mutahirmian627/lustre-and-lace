"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/actions/admin/reviews.actions";

const STATUSES: { value: ReviewStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
];

export function ReviewsFilterBar({
  status,
  products,
}: {
  status: ReviewStatus;
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 border-b border-border pb-2">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/admin/reviews?status=${s.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              status === s.value
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>
      <Select
        items={[
          { label: "All Ratings", value: "__all__" },
          ...[5, 4, 3, 2, 1].map((r) => ({ label: `${r} Stars`, value: String(r) })),
        ]}
        value={searchParams.get("rating") ?? "__all__"}
        onValueChange={(v) => updateParam("rating", v === "__all__" || !v ? "" : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Ratings</SelectItem>
          {[5, 4, 3, 2, 1].map((r) => (
            <SelectItem key={r} value={String(r)}>
              {r} Stars
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        items={[{ label: "All Products", value: "__all__" }, ...products.map((p) => ({ label: p.name, value: p.id }))]}
        value={searchParams.get("productId") ?? "__all__"}
        onValueChange={(v) => updateParam("productId", v === "__all__" || !v ? "" : v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Products</SelectItem>
          {products.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
