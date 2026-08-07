"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * Dismissible-but-recurring: dismissal is local component state only, not
 * persisted anywhere, so it naturally reappears on the next page load
 * rather than being permanently silenced (specs/03) — verification stays a
 * soft nudge, never a hard block, since guest checkout must keep working.
 */
export function VerifyEmailBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);

  if (!session?.user || session.user.emailVerified || dismissed) {
    return null;
  }

  const resend = async () => {
    await authClient.sendVerificationEmail({
      email: session.user.email,
      callbackURL: "/verify-email",
    });
    setSent(true);
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-secondary px-4 py-2 text-sm text-secondary-foreground">
      <p>
        {sent
          ? "Verification email sent — check your inbox."
          : "Please verify your email to unlock your full account."}
      </p>
      <div className="flex items-center gap-3">
        {!sent && (
          <Button variant="link" size="sm" onClick={resend} className="h-auto p-0">
            Resend email
          </Button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-secondary-foreground/70 hover:text-secondary-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
