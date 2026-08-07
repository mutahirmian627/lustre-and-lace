import type { Metadata } from "next";
import Link from "next/link";
import { getInventory, type InventoryFilter } from "@/actions/admin/inventory.actions";
import { InventoryQuickEditRow } from "@/features/admin/components/InventoryQuickEditRow";
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Inventory" };

const FILTERS: { value: InventoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: InventoryFilter }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter: InventoryFilter = FILTERS.some((f) => f.value === rawFilter) ? rawFilter! : "all";
  const variants = await getInventory(filter);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-foreground">Inventory</h2>

      <div className="flex gap-1 border-b border-border pb-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/inventory?filter=${f.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.value
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {variants.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No variants in this view.</p>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stock Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => (
                <InventoryQuickEditRow
                  key={v.id}
                  variantId={v.id}
                  productId={v.product.id}
                  productName={v.product.name}
                  variantName={v.name}
                  stockQuantity={v.stockQuantity}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
