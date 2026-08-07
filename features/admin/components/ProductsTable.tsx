"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Copy, Trash2 } from "lucide-react";
import { DataTable } from "@/features/admin/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  bulkSetActive,
  bulkSetFlag,
  softDeleteProduct,
  duplicateProduct,
  toggleProductFlag,
} from "@/actions/admin/products.actions";
import { formatCurrency } from "@/utils/format-currency";
import type { getAdminProducts } from "@/actions/admin/products.actions";

type ProductRow = Awaited<ReturnType<typeof getAdminProducts>>["products"][number];

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(action: () => Promise<{ error: string } | { success: true }>) {
    const result = await action();
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setSelected(new Set());
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await softDeleteProduct(id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Product deleted.");
    router.refresh();
  }

  async function handleDuplicate(id: string) {
    const result = await duplicateProduct(id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Product duplicated.");
    router.refresh();
  }

  async function handleToggleFlag(id: string, flag: "isFeatured" | "isTrending", value: boolean) {
    const result = await toggleProductFlag(id, flag, value);
    if ("error" in result) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm">
          <span className="text-accent-foreground">{selected.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runBulk(() => bulkSetActive(Array.from(selected), true))}
          >
            Activate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runBulk(() => bulkSetActive(Array.from(selected), false))}
          >
            Deactivate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runBulk(() => bulkSetFlag(Array.from(selected), "isFeatured", true))}
          >
            Mark Featured
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runBulk(() => bulkSetFlag(Array.from(selected), "isTrending", true))}
          >
            Mark Trending
          </Button>
        </div>
      )}

      <DataTable
        rows={products}
        rowKey={(p) => p.id}
        emptyMessage="No products found."
        columns={[
          {
            header: "",
            cell: (p) => (
              <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelected(p.id)} />
            ),
          },
          {
            header: "Product",
            cell: (p) => {
              const thumb = p.images.find((i) => i.isPrimary) ?? p.images[0];
              return (
                <div className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    {thumb && (
                      <Image src={thumb.url} alt="" fill sizes="40px" className="object-cover" unoptimized />
                    )}
                  </div>
                  <Link href={`/admin/products/${p.id}/edit`} className="text-primary hover:underline">
                    {p.name}
                  </Link>
                </div>
              );
            },
          },
          { header: "Category", cell: (p) => p.category?.name ?? "—" },
          {
            header: "Price Range",
            cell: (p) => {
              if (p.variants.length === 0) return "—";
              const prices = p.variants.map((v) => Number(v.price));
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;
            },
          },
          {
            header: "Stock",
            cell: (p) => p.variants.reduce((sum, v) => sum + v.stockQuantity, 0),
          },
          {
            header: "Status",
            cell: (p) =>
              p.isActive ? (
                <Badge variant="outline" className="border-success text-success">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              ),
          },
          {
            header: "Featured",
            cell: (p) => (
              <Checkbox
                checked={p.isFeatured}
                onCheckedChange={(checked) => handleToggleFlag(p.id, "isFeatured", !!checked)}
              />
            ),
          },
          {
            header: "Trending",
            cell: (p) => (
              <Checkbox
                checked={p.isTrending}
                onCheckedChange={(checked) => handleToggleFlag(p.id, "isTrending", !!checked)}
              />
            ),
          },
          {
            header: "Actions",
            cell: (p) => (
              <div className="flex items-center gap-1">
                <Link href={`/admin/products/${p.id}/edit`}>
                  <Button variant="ghost" size="icon-sm" aria-label="Edit">
                    <Pencil className="size-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon-sm" aria-label="Duplicate" onClick={() => handleDuplicate(p.id)}>
                  <Copy className="size-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
