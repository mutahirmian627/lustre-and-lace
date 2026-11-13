import type { Metadata } from "next";
import Link from "next/link";
import { getSafeRedirect } from "@/utils/safe-redirect";
import { ResendVerificationButton } from "@/features/auth/components/ResendVerificationButton";

export const metadata: Metadata = { title: "Verify Email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pending?: string; email?: string; redirect?: string }>;
}) {
  const { error, pending, email, redirect } = await searchParams;
  const safeRedirect = getSafeRedirect(redirect);
  const loginHref = safeRedirect ? `/shop/login?redirect=${encodeURIComponent(safeRedirect)}` : "/shop/login";

  if (error) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="font-heading text-2xl text-foreground">
          That link didn&apos;t work
        </h1>
        <p className="text-sm text-muted-foreground">
          This verification link is invalid or has expired. Sign in and
          we&apos;ll give you the option to resend it.
        </p>
        <Link href="/shop/login" className="text-sm text-primary underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (pending) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="font-heading text-2xl text-foreground">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification link to{" "}
          {email ? <strong className="font-medium text-foreground">{email}</strong> : "your email address"}. Click it to
          activate your account, then sign in. It expires in 24 hours.
        </p>
        {email && <ResendVerificationButton email={email} className="flex flex-col items-center" />}
        <Link href={loginHref} className="block text-sm text-primary underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <h1 className="font-heading text-2xl text-foreground">
        Email verified
      </h1>
      <p className="text-sm text-muted-foreground">
        Your email address has been confirmed. Sign in to start shopping.
      </p>
      <Link href="/shop/login" className="text-sm text-primary underline underline-offset-4">
        Continue to sign in
      </Link>
    </div>
  );
}
