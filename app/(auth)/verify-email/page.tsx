import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Verify Email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pending?: string }>;
}) {
  const { error, pending } = await searchParams;

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
        <Link href="/login" className="text-sm text-primary hover:underline">
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
          We&apos;ve sent a verification link to your email address. It
          expires in 24 hours.
        </p>
        <Link href="/login" className="text-sm text-primary hover:underline">
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
        Your email address has been confirmed. You&apos;re all set.
      </p>
      <Link href="/login" className="text-sm text-primary hover:underline">
        Continue to sign in
      </Link>
    </div>
  );
}
