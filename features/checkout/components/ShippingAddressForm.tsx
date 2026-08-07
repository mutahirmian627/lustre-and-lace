import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { CheckoutInput } from "@/features/checkout/types";

export function ShippingAddressForm({
  register,
  errors,
  control,
  isLoggedIn,
}: {
  register: UseFormRegister<CheckoutInput>;
  errors: FieldErrors<CheckoutInput>;
  control: Control<CheckoutInput>;
  isLoggedIn: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl text-foreground">Shipping Address</h2>
      <Field data-invalid={!!errors.fullName}>
        <FieldLabel htmlFor="fullName">Full name</FieldLabel>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
        <FieldError errors={[errors.fullName]} />
      </Field>
      <Field data-invalid={!!errors.phone}>
        <FieldLabel htmlFor="phone">Phone</FieldLabel>
        <Input id="phone" type="tel" placeholder="03XXXXXXXXX" autoComplete="tel" {...register("phone")} />
        <FieldError errors={[errors.phone]} />
      </Field>
      <Field data-invalid={!!errors.addressLine1}>
        <FieldLabel htmlFor="addressLine1">Address line 1</FieldLabel>
        <Input id="addressLine1" autoComplete="address-line1" {...register("addressLine1")} />
        <FieldError errors={[errors.addressLine1]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="addressLine2">Address line 2 (optional)</FieldLabel>
        <Input id="addressLine2" autoComplete="address-line2" {...register("addressLine2")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={!!errors.city}>
          <FieldLabel htmlFor="city">City</FieldLabel>
          <Input id="city" autoComplete="address-level2" {...register("city")} />
          <FieldError errors={[errors.city]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="province">Province (optional)</FieldLabel>
          <Input id="province" autoComplete="address-level1" {...register("province")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="postalCode">Postal code (optional)</FieldLabel>
          <Input id="postalCode" autoComplete="postal-code" {...register("postalCode")} />
        </Field>
      </div>

      {isLoggedIn && (
        <Controller
          control={control}
          name="saveAddress"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
              Save this address for next time
            </label>
          )}
        />
      )}
    </div>
  );
}
