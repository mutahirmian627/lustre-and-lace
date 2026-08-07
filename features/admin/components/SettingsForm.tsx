"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { updatePlatformSettings } from "@/actions/admin/settings.actions";
import { platformSettingsFormSchema, type PlatformSettingsFormInput } from "@/features/admin/types";

export function SettingsForm({ initialValues }: { initialValues: PlatformSettingsFormInput }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlatformSettingsFormInput>({
    resolver: zodResolver(platformSettingsFormSchema) as Resolver<PlatformSettingsFormInput>,
    defaultValues: initialValues,
  });

  async function onSubmit(data: PlatformSettingsFormInput) {
    const result = await updatePlatformSettings(data);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.easypaisaNumber}>
          <FieldLabel>EasyPaisa Number</FieldLabel>
          <Input {...register("easypaisaNumber")} />
          <FieldError errors={[errors.easypaisaNumber]} />
        </Field>
        <Field data-invalid={!!errors.jazzcashNumber}>
          <FieldLabel>JazzCash Number</FieldLabel>
          <Input {...register("jazzcashNumber")} />
          <FieldError errors={[errors.jazzcashNumber]} />
        </Field>
      </div>
      <Field data-invalid={!!errors.whatsappBusinessNumber}>
        <FieldLabel>WhatsApp Business Number</FieldLabel>
        <Input {...register("whatsappBusinessNumber")} />
        <FieldError errors={[errors.whatsappBusinessNumber]} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.flatShippingRatePkr}>
          <FieldLabel>Flat Shipping Rate (PKR)</FieldLabel>
          <Input type="number" step="0.01" {...register("flatShippingRatePkr")} />
          <FieldError errors={[errors.flatShippingRatePkr]} />
        </Field>
        <Field data-invalid={!!errors.autoCancelUnpaidHours}>
          <FieldLabel>Auto-Cancel Unpaid Orders After (hours)</FieldLabel>
          <Input type="number" {...register("autoCancelUnpaidHours")} />
          <FieldError errors={[errors.autoCancelUnpaidHours]} />
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
