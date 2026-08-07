"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { updateVariantStock } from "@/actions/admin/inventory.actions";
import { LOW_STOCK_THRESHOLD } from "@/constants/inventory";

export function InventoryQuickEditRow({
  variantId,
  productId,
  productName,
  variantName,
  stockQuantity,
}: {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  stockQuantity: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(stockQuantity));
  const [isSaving, setIsSaving] = useState(false);

  const parsed = Number(value);
  const isDirty = parsed !== stockQuantity;

  async function handleSave() {
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error("Enter a non-negative whole number.");
      return;
    }
    setIsSaving(true);
    const result = await updateVariantStock(variantId, parsed);
    setIsSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Stock updated.");
    router.refresh();
  }

  const statusBadge =
    stockQuantity === 0 ? (
      <Badge variant="destructive">Out of Stock</Badge>
    ) : stockQuantity <= LOW_STOCK_THRESHOLD ? (
      <Badge variant="secondary">Low Stock</Badge>
    ) : (
      <Badge variant="outline" className="border-success text-success">
        In Stock
      </Badge>
    );

  return (
    <TableRow>
      <TableCell>
        <Link href={`/admin/products/${productId}/edit`} className="text-primary hover:underline">
          {productName}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">{variantName}</TableCell>
      <TableCell>{statusBadge}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input type="number" value={value} onValueChange={setValue} className="w-20" />
          <Button size="sm" variant="outline" disabled={!isDirty || isSaving} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
