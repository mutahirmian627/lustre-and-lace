"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function CustomersSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("search", value);
    else params.delete("search");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Input
      placeholder="Search by name or email..."
      defaultValue={searchParams.get("search") ?? ""}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSearch((e.target as HTMLInputElement).value);
      }}
      className="max-w-xs"
    />
  );
}
