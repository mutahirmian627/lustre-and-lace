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
import { cancelOrder } from "@/actions/orders.actions";

/** Destructive action — gated behind an explicit confirmation dialog (specs/11). */
export function CancelOrderDialog({ orderId, orderReference }: { orderId: string; orderReference: string }) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    setIsCancelling(true);
    const result = await cancelOrder(orderId);
    setIsCancelling(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    toast.success(`${orderReference} has been cancelled.`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Cancel Order</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel {orderReference}?</DialogTitle>
          <DialogDescription>
            This will cancel your order and restock the items. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep Order</DialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={isCancelling}>
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
