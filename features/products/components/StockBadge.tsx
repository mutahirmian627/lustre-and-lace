import { Badge } from "@/components/ui/badge";

const LOW_STOCK_THRESHOLD = 5;

/** Never shows the exact count publicly — that's an admin-only detail (specs/06). */
export function StockBadge({ stockQuantity }: { stockQuantity: number }) {
  if (stockQuantity === 0) {
    return <Badge variant="destructive">Out of Stock</Badge>;
  }
  if (stockQuantity <= LOW_STOCK_THRESHOLD) {
    return <Badge variant="secondary">Low Stock</Badge>;
  }
  return (
    <Badge variant="outline" className="border-success text-success">
      In Stock
    </Badge>
  );
}
