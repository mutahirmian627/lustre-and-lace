import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getAdminCoupons } from "@/actions/admin/coupons.actions";
import { CouponsTable } from "@/features/admin/components/CouponsTable";
import { CouponFormDialog } from "@/features/admin/components/CouponFormDialog";

export const metadata: Metadata = { title: "Admin — Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-foreground">Coupons</h2>
        <CouponFormDialog trigger={<Button>+ New Coupon</Button>} />
      </div>
      <CouponsTable coupons={coupons} />
    </div>
  );
}
