"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { mergeGuestCart } from "@/actions/cart.actions";
import { getPostLoginPath } from "@/actions/auth.actions";
import { ResendVerificationButton } from "@/features/auth/components/ResendVerificationButton";
import { loginSchema, type LoginInput } from "@/features/auth/types";
import { getSafeRedirect, isCheckoutRedirect } from "@/utils/safe-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    setUnverifiedEmail(null);
    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
    });
    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(data.email);
        return;
      }
      setFormError(error.message ?? "Invalid email or password.");
      return;
    }
    await mergeGuestCart();
    // Admins go straight to their panel; everyone else to where they were headed.
    router.push(await getPostLoginPath(redirect));
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue to your account
        </p>
      </div>

      {isCheckoutRedirect(redirect) && (
        <Alert>
          <AlertDescription>
            You need an account to place an order. Sign in below, or create one — your cart will be
            waiting.
          </AlertDescription>
        </Alert>
      )}

      {unverifiedEmail && (
        <Alert>
          <AlertDescription className="space-y-3">
            <span className="block">
              Please verify your email before signing in. Open the link we emailed to {unverifiedEmail}, or request a new one.
            </span>
            <ResendVerificationButton email={unverifiedEmail} />
          </AlertDescription>
        </Alert>
      )}

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/shop/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={redirect ? `/shop/register?redirect=${encodeURIComponent(redirect)}` : "/shop/register"}
          className="text-primary underline underline-offset-4 hover:no-underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
