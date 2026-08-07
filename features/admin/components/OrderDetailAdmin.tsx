"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  confirmPayment,
  markCodPaymentReceived,
  advanceOrderStatus,
  cancelOrderAdmin,
} from "@/actions/admin/orders.actions";

const NEXT_STATUS_LABEL: Record<string, string> = {
  pending: "Mark as Processing",
  processing: "Mark as Shipped",
  shipped: "Mark as Delivered",
};

export function OrderDetailAdmin({
  orderId,
  orderReference,
  status,
  paymentMethod,
  paymentStatus,
}: {
  orderId: string;
  orderReference: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function run(action: () => Promise<{ error: string } | { success: true }>, successMessage: string) {
    setIsBusy(true);
    const result = await action();
    setIsBusy(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(successMessage);
    router.refresh();
  }

  const canCancel = status === "pending" || status === "processing";
  const nextStatusLabel = NEXT_STATUS_LABEL[status];

  return (
    <div className="flex flex-wrap gap-3">
      {paymentStatus === "awaiting_confirmation" && (
        <Button disabled={isBusy} onClick={() => run(() => confirmPayment(orderId), "Payment confirmed.")}>
          Confirm Payment
        </Button>
      )}
      {paymentMethod === "cod" && paymentStatus === "cod_pending" && (
        <Button
          disabled={isBusy}
          onClick={() => run(() => markCodPaymentReceived(orderId), "COD payment marked as received.")}
        >
          Mark Payment Received
        </Button>
      )}
      {nextStatusLabel && (
        <Button
          variant="outline"
          disabled={isBusy}
          onClick={() => run(() => advanceOrderStatus(orderId), `Order marked as ${status === "pending" ? "processing" : status === "processing" ? "shipped" : "delivered"}.`)}
        >
          {nextStatusLabel}
        </Button>
      )}
      {canCancel && (
        <Dialog>
          <DialogTrigger render={<Button variant="destructive" />}>Cancel Order</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel {orderReference}?</DialogTitle>
              <DialogDescription>
                This restocks the items and reverses any coupon usage. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Keep Order</DialogClose>
              <Button
                variant="destructive"
                disabled={isBusy}
                onClick={() => run(() => cancelOrderAdmin(orderId), "Order cancelled.")}
              >
                Cancel Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
