"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { updateProfile } from "@/actions/account.actions";
import { profileFormSchema, type ProfileFormInput } from "@/features/account/types";

export function ProfileForm({ name, phone }: { name: string; phone: string | null }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name, phone: phone ?? "" },
  });

  async function onSubmit(data: ProfileFormInput) {
    const result = await updateProfile(data);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">Full name</FieldLabel>
        <Input id="name" {...register("name")} />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={!!errors.phone}>
        <FieldLabel htmlFor="phone">Phone</FieldLabel>
        <Input id="phone" type="tel" placeholder="03XXXXXXXXX" {...register("phone")} />
        <FieldError errors={[errors.phone]} />
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
