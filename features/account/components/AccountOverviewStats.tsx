import { Package, Heart } from "lucide-react";

export function AccountOverviewStats({
  orderCount,
  wishlistCount,
}: {
  orderCount: number;
  wishlistCount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-3 rounded-lg border border-border p-4">
        <Package className="size-8 text-primary" />
        <div>
          <p className="font-heading text-2xl text-foreground">{orderCount}</p>
          <p className="text-sm text-muted-foreground">Orders</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-border p-4">
        <Heart className="size-8 text-primary" />
        <div>
          <p className="font-heading text-2xl text-foreground">{wishlistCount}</p>
          <p className="text-sm text-muted-foreground">Wishlist Items</p>
        </div>
      </div>
    </div>
  );
}
