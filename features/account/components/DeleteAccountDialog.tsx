"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import { requestAccountDeletion } from "@/actions/account.actions";
import { deleteAccountConfirmSchema, type DeleteAccountConfirmInput } from "@/features/account/types";

/**
 * First of the two steps described in specs/12 — typing "DELETE" only
 * requests an email-confirmation link, it never deletes anything itself.
 * The actual hard delete happens on /account/delete-confirm after the
 * customer clicks that link.
 */
export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountConfirmInput>({ resolver: zodResolver(deleteAccountConfirmSchema) });

  async function onSubmit() {
    const result = await requestAccountDeletion();
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setEmailSent(true);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setEmailSent(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="destructive" />}>Delete My Account</DialogTrigger>
      <DialogContent>
        {emailSent ? (
          <>
            <DialogHeader>
              <DialogTitle>Check your email</DialogTitle>
              <DialogDescription>
                We&apos;ve sent a confirmation link to your email address. Your account won&apos;t be
                deleted until you click it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your saved addresses, wishlist, and cart. Your past
                orders stay on record but are no longer linked to an account. This can&apos;t be
                undone.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field data-invalid={!!errors.confirmationText}>
                <FieldLabel htmlFor="confirmationText">Type DELETE to confirm</FieldLabel>
                <Input id="confirmationText" autoComplete="off" {...register("confirmationText")} />
                <FieldError errors={[errors.confirmationText]} />
              </Field>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
                <Button type="submit" variant="destructive" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Confirmation Email"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
