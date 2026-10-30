"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createFaq, updateFaq } from "@/actions/admin/faqs.actions";
import { faqFormSchema, type FaqFormInput } from "@/features/support/types";
import type { faqs } from "@/db/schema";

type Faq = typeof faqs.$inferSelect;

export function FaqFormDialog({ faq, trigger }: { faq?: Faq; trigger: React.ReactElement }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function buildDefaultValues(): FaqFormInput {
    return faq
      ? { question: faq.question, answer: faq.answer, displayOrder: faq.displayOrder, isActive: faq.isActive }
      : { question: "", answer: "", displayOrder: 0, isActive: true };
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FaqFormInput>({
    resolver: zodResolver(faqFormSchema) as Resolver<FaqFormInput>,
    defaultValues: buildDefaultValues(),
  });

  useEffect(() => {
    if (open) reset(buildDefaultValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(data: FaqFormInput) {
    const result = faq ? await updateFaq(faq.id, data) : await createFaq(data);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(faq ? "Quick answer updated." : "Quick answer created.");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{faq ? "Edit Quick Answer" : "New Quick Answer"}</DialogTitle>
          <DialogDescription>Shown to every visitor in the chat, signed in or not.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.question}>
            <FieldLabel>Question</FieldLabel>
            <Input {...register("question")} placeholder="How long does delivery take?" />
            <FieldError errors={[errors.question]} />
          </Field>
          <Field data-invalid={!!errors.answer}>
            <FieldLabel>Answer</FieldLabel>
            <Textarea rows={5} {...register("answer")} />
            <FieldError errors={[errors.answer]} />
          </Field>
          <Field>
            <FieldLabel>Order</FieldLabel>
            <Input type="number" min={0} {...register("displayOrder")} />
            <FieldDescription>Lower numbers appear first.</FieldDescription>
          </Field>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                Show in chat
              </label>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : faq ? "Save Changes" : "Create Quick Answer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
