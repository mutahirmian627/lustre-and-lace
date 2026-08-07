"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCoupon, updateCoupon } from "@/actions/admin/coupons.actions";
import { couponFormSchema, type CouponFormInput } from "@/features/admin/types";
import type { coupons } from "@/db/schema";

type Coupon = typeof coupons.$inferSelect;

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function CouponFormDialog({
  coupon,
  trigger,
}: {
  coupon?: Coupon;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function buildDefaultValues(): CouponFormInput {
    return coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          value: Number(coupon.value),
          minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : "",
          maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : "",
          usageLimit: coupon.usageLimit ?? "",
          startsAt: toDateInputValue(coupon.startsAt),
          expiresAt: toDateInputValue(coupon.expiresAt),
          isActive: coupon.isActive,
        }
      : {
          code: "",
          type: "percentage",
          value: 0,
          minOrderAmount: "",
          maxDiscountAmount: "",
          usageLimit: "",
          startsAt: "",
          expiresAt: "",
          isActive: true,
        };
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormInput>({
    resolver: zodResolver(couponFormSchema) as Resolver<CouponFormInput>,
    defaultValues: buildDefaultValues(),
  });

  useEffect(() => {
    if (open) reset(buildDefaultValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(data: CouponFormInput) {
    const result = coupon ? await updateCoupon(coupon.id, data) : await createCoupon(data);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(coupon ? "Coupon updated." : "Coupon created.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit Coupon" : "New Coupon"}</DialogTitle>
          <DialogDescription>Discounts apply automatically at checkout when the code matches.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.code}>
            <FieldLabel>Code</FieldLabel>
            <Input {...register("code")} className="uppercase" />
            <FieldError errors={[errors.code]} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <Select
                    items={[
                      { label: "Percentage", value: "percentage" },
                      { label: "Fixed Amount", value: "fixed" },
                    ]}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Field data-invalid={!!errors.value}>
              <FieldLabel>Value</FieldLabel>
              <Input type="number" step="0.01" {...register("value")} />
              <FieldError errors={[errors.value]} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Min Order Amount (optional)</FieldLabel>
              <Input type="number" step="0.01" {...register("minOrderAmount")} />
            </Field>
            <Field>
              <FieldLabel>Max Discount Amount (optional)</FieldLabel>
              <Input type="number" step="0.01" {...register("maxDiscountAmount")} />
            </Field>
          </div>
          <Field>
            <FieldLabel>Usage Limit (optional)</FieldLabel>
            <Input type="number" {...register("usageLimit")} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>Starts At (optional)</FieldLabel>
              <Input type="date" {...register("startsAt")} />
            </Field>
            <Field>
              <FieldLabel>Expires At (optional)</FieldLabel>
              <Input type="date" {...register("expiresAt")} />
            </Field>
          </div>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                Active
              </label>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : coupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
