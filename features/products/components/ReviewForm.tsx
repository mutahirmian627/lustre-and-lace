"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { submitReview } from "@/actions/reviews.actions";
import { reviewFormSchema, type ReviewFormInput } from "@/features/products/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  productSlug,
  orderId,
}: {
  productId: string;
  productSlug: string;
  orderId?: string;
}) {
  const { data: session, isPending } = useSession();
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormInput>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 0 },
  });

  if (isPending) return null;

  if (!session?.user) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }

  if (!session.user.emailVerified) {
    return (
      <p className="text-sm text-muted-foreground">
        Please verify your email before writing a review.
      </p>
    );
  }

  if (submitted) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks! Your review will appear once it&apos;s approved.
      </p>
    );
  }

  const onSubmit = async (data: ReviewFormInput) => {
    const result = await submitReview({ productId, productSlug, orderId, ...data });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSubmitted(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        control={control}
        name="rating"
        render={({ field }) => (
          <Field data-invalid={!!errors.rating}>
            <FieldLabel>Your rating</FieldLabel>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  onClick={() => field.onChange(star)}
                >
                  <Star
                    className={cn(
                      "size-6",
                      star <= field.value
                        ? "fill-primary text-primary"
                        : "fill-none text-border"
                    )}
                  />
                </button>
              ))}
            </div>
            <FieldError errors={[errors.rating]} />
          </Field>
        )}
      />

      <Field>
        <FieldLabel htmlFor="title">Title (optional)</FieldLabel>
        <Input id="title" {...register("title")} />
      </Field>

      <Field>
        <FieldLabel htmlFor="comment">Your review (optional)</FieldLabel>
        <Textarea id="comment" rows={4} {...register("comment")} />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
