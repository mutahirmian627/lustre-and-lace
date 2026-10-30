"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { OrderStatusBadge } from "@/features/account/components/OrderStatusBadge";
import { OrderTimeline } from "@/features/account/components/OrderTimeline";
import { trackGuestOrder } from "@/actions/orders.actions";
import { formatCurrency } from "@/utils/format-currency";

const lookupSchema = z.object({
  reference: z.string().min(3, "Enter your order reference."),
  email: z.email("Enter the email used at checkout."),
});

type LookupInput = z.infer<typeof lookupSchema>;
type TrackedOrder = Extract<
  Awaited<ReturnType<typeof trackGuestOrder>>,
  { success: true }
>["order"];

function isSuccess(
  result: Awaited<ReturnType<typeof trackGuestOrder>>
): result is Extract<Awaited<ReturnType<typeof trackGuestOrder>>, { success: true }> {
  return result.success;
}

export function GuestOrderLookupForm() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LookupInput>({ resolver: zodResolver(lookupSchema) });

  async function onSubmit(data: LookupInput) {
    setNotFoundError(null);
    const result = await trackGuestOrder(data.reference, data.email);
    if (!isSuccess(result)) {
      setOrder(null);
      setNotFoundError(result.error);
      return;
    }
    setOrder(result.order);
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.reference}>
          <FieldLabel htmlFor="reference">Order Reference</FieldLabel>
          <Input id="reference" placeholder="LL-2026-00001" {...register("reference")} />
          <FieldError errors={[errors.reference]} />
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" {...register("email")} />
          <FieldError errors={[errors.email]} />
        </Field>
        <Button type="submit" disabled={isSubmitting} className="sm:col-span-2" size="lg">
          {isSubmitting ? "Searching..." : "Track Order"}
        </Button>
      </form>

      {notFoundError && <p className="text-sm text-destructive">{notFoundError}</p>}

      {order && (
        <div className="space-y-6 rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl text-foreground">{order.orderReference}</h2>
            <OrderStatusBadge status={order.status} />
          </div>

          <OrderTimeline status={order.status} />

          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {item.productName}
                  {item.variantName ? ` — ${item.variantName}` : ""} × {item.quantity}
                </span>
                <span className="text-foreground">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
