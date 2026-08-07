import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { CheckoutInput } from "@/features/checkout/types";

export function ContactInfoForm({
  register,
  errors,
}: {
  register: UseFormRegister<CheckoutInput>;
  errors: FieldErrors<CheckoutInput>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl text-foreground">Contact Information</h2>
      <Field data-invalid={!!errors.customerName}>
        <FieldLabel htmlFor="customerName">Full name</FieldLabel>
        <Input id="customerName" autoComplete="name" {...register("customerName")} />
        <FieldError errors={[errors.customerName]} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.customerEmail}>
          <FieldLabel htmlFor="customerEmail">Email</FieldLabel>
          <Input id="customerEmail" type="email" autoComplete="email" {...register("customerEmail")} />
          <FieldError errors={[errors.customerEmail]} />
        </Field>
        <Field data-invalid={!!errors.customerPhone}>
          <FieldLabel htmlFor="customerPhone">Phone</FieldLabel>
          <Input id="customerPhone" type="tel" placeholder="03XXXXXXXXX" autoComplete="tel" {...register("customerPhone")} />
          <FieldError errors={[errors.customerPhone]} />
        </Field>
      </div>
    </div>
  );
}
