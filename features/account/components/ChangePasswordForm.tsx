"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { changePassword } from "@/lib/auth-client";
import { changePasswordFormSchema, type ChangePasswordFormInput } from "@/features/account/types";

/** Calls Better Auth's client-side changePassword directly — same "don't wrap standard auth flows" principle as login/register/reset (specs/03, specs/12). */
export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormInput>({ resolver: zodResolver(changePasswordFormSchema) });

  async function onSubmit(data: ChangePasswordFormInput) {
    const { error } = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      revokeOtherSessions: true,
    });
    if (error) {
      toast.error(error.message ?? "Couldn't change your password.");
      return;
    }
    toast.success("Password changed.");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field data-invalid={!!errors.currentPassword}>
        <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
        <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
        <FieldError errors={[errors.currentPassword]} />
      </Field>
      <Field data-invalid={!!errors.newPassword}>
        <FieldLabel htmlFor="newPassword">New password</FieldLabel>
        <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
        <FieldError errors={[errors.newPassword]} />
      </Field>
      <Field data-invalid={!!errors.confirmNewPassword}>
        <FieldLabel htmlFor="confirmNewPassword">Confirm new password</FieldLabel>
        <Input id="confirmNewPassword" type="password" autoComplete="new-password" {...register("confirmNewPassword")} />
        <FieldError errors={[errors.confirmNewPassword]} />
      </Field>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Changing..." : "Change Password"}
      </Button>
    </form>
  );
}
