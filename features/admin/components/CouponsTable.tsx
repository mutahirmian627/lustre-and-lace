"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/features/admin/components/DataTable";
import { CouponFormDialog } from "@/features/admin/components/CouponFormDialog";
import { deleteCoupon, toggleCouponActive } from "@/actions/admin/coupons.actions";
import { formatCurrency } from "@/utils/format-currency";
import type { coupons } from "@/db/schema";

type Coupon = typeof coupons.$inferSelect;

export function CouponsTable({ coupons: allCoupons }: { coupons: Coupon[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const result = await deleteCoupon(id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Coupon deleted.");
    router.refresh();
  }

  async function handleToggle(id: string, isActive: boolean) {
    const result = await toggleCouponActive(id, isActive);
    if ("error" in result) toast.error(result.error);
    else router.refresh();
  }

  return (
    <DataTable
      rows={allCoupons}
      rowKey={(c) => c.id}
      emptyMessage="No coupons yet."
      columns={[
        { header: "Code", cell: (c) => <span className="font-medium text-foreground">{c.code}</span> },
        {
          header: "Discount",
          cell: (c) => (c.type === "percentage" ? `${Number(c.value)}%` : formatCurrency(c.value)),
        },
        { header: "Min Order", cell: (c) => (c.minOrderAmount ? formatCurrency(c.minOrderAmount) : "—") },
        { header: "Max Discount", cell: (c) => (c.maxDiscountAmount ? formatCurrency(c.maxDiscountAmount) : "—") },
        {
          header: "Usage",
          cell: (c) => (
            <span title="System-managed — incremented at checkout, decremented on cancellation">
              {c.usageCount}
              {c.usageLimit ? ` / ${c.usageLimit}` : ""}
            </span>
          ),
        },
        {
          header: "Valid",
          cell: (c) => {
            const parts = [];
            if (c.startsAt) parts.push(`from ${c.startsAt.toLocaleDateString("en-PK", { day: "numeric", month: "short" })}`);
            if (c.expiresAt) parts.push(`until ${c.expiresAt.toLocaleDateString("en-PK", { day: "numeric", month: "short" })}`);
            return parts.length > 0 ? parts.join(" ") : "Always";
          },
        },
        {
          header: "Active",
          cell: (c) => <Checkbox checked={c.isActive} onCheckedChange={(checked) => handleToggle(c.id, !!checked)} />,
        },
        {
          header: "Actions",
          cell: (c) => (
            <div className="flex items-center gap-1">
              <CouponFormDialog
                coupon={c}
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Edit">
                    <Pencil className="size-4" />
                  </Button>
                }
              />
              <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => handleDelete(c.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ),
        },
      ]}
    />
  );
}
