import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProductListPagination({
  basePath,
  currentParams,
  page,
  totalPages,
}: {
  basePath: string;
  currentParams: Record<string, string | string[] | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(currentParams)) {
      if (key === "page") continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else if (value != null) params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PageLink
            href={page > 1 ? hrefFor(page - 1) : undefined}
            aria-label="Go to previous page"
          >
            <ChevronLeftIcon className="size-4" />
          </PageLink>
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <PaginationItem key={p}>
            <PageLink href={hrefFor(p)} isActive={p === page}>
              {p}
            </PageLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PageLink
            href={page < totalPages ? hrefFor(page + 1) : undefined}
            aria-label="Go to next page"
          >
            <ChevronRightIcon className="size-4" />
          </PageLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PageLink({
  href,
  isActive,
  children,
  ...props
}: {
  href?: string;
  isActive?: boolean;
  children: React.ReactNode;
} & React.ComponentProps<"a">) {
  const className = cn(
    buttonVariants({ variant: isActive ? "outline" : "ghost", size: "icon" }),
    !href && "pointer-events-none opacity-40"
  );

  if (!href) {
    return (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} aria-current={isActive ? "page" : undefined} {...props}>
      {children}
    </Link>
  );
}
