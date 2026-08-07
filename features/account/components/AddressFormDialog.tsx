"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addAddress, updateAddress } from "@/actions/account.actions";
import { addressFormSchema, type AddressFormInput } from "@/features/account/types";
import type { addresses } from "@/db/schema";

type Address = typeof addresses.$inferSelect;

export function AddressFormDialog({
  address,
  trigger,
}: {
  address?: Address;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function buildDefaultValues(): AddressFormInput {
    return address
      ? {
          label: address.label ?? "",
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? "",
          city: address.city,
          province: address.province ?? "",
          postalCode: address.postalCode ?? "",
          isDefault: address.isDefault,
        }
      : {
          label: "",
          fullName: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          province: "",
          postalCode: "",
          isDefault: false,
        };
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormInput>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: buildDefaultValues(),
  });

  // useForm's defaultValues are only read once at mount — this component
  // instance persists across router.refresh() (same key, same AddressCard),
  // so without resetting on every open the form would silently resubmit
  // whatever `address` looked like when the dialog first mounted, not its
  // current state (e.g. clobbering isDefault back to a stale value).
  useEffect(() => {
    if (open) reset(buildDefaultValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(data: AddressFormInput) {
    const result = address ? await updateAddress(address.id, data) : await addAddress(data);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(address ? "Address updated." : "Address added.");
    setOpen(false);
    if (!address) reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{address ? "Edit Address" : "Add New Address"}</DialogTitle>
          <DialogDescription>Used to pre-fill your shipping details at checkout.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="label">Label (optional)</FieldLabel>
            <Input id="label" placeholder="Home, Office..." {...register("label")} />
          </Field>
          <Field data-invalid={!!errors.fullName}>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input id="fullName" {...register("fullName")} />
            <FieldError errors={[errors.fullName]} />
          </Field>
          <Field data-invalid={!!errors.phone}>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input id="phone" type="tel" placeholder="03XXXXXXXXX" {...register("phone")} />
            <FieldError errors={[errors.phone]} />
          </Field>
          <Field data-invalid={!!errors.addressLine1}>
            <FieldLabel htmlFor="addressLine1">Address line 1</FieldLabel>
            <Input id="addressLine1" {...register("addressLine1")} />
            <FieldError errors={[errors.addressLine1]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="addressLine2">Address line 2 (optional)</FieldLabel>
            <Input id="addressLine2" {...register("addressLine2")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={!!errors.city}>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input id="city" {...register("city")} />
              <FieldError errors={[errors.city]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="province">Province (optional)</FieldLabel>
              <Input id="province" {...register("province")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="postalCode">Postal code (optional)</FieldLabel>
              <Input id="postalCode" {...register("postalCode")} />
            </Field>
          </div>

          <Controller
            control={control}
            name="isDefault"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                Set as default address
              </label>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : address ? "Save Changes" : "Add Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
