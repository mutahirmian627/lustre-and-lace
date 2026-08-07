"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendVerificationEmail } from "@/lib/auth-client";

/**
 * Persistent-but-dismissible-per-session (specs/12) — dismissal only lives
 * in component state, so it reappears next visit rather than being
 * permanently silenced.
 */
export function EmailVerificationBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (dismissed) return null;

  async function handleResend() {
    setIsSending(true);
    const { error } = await sendVerificationEmail({ email, callbackURL: "/account" });
    setIsSending(false);
    if (error) {
      toast.error(error.message ?? "Couldn't send the verification email.");
      return;
    }
    toast.success("Verification email sent — check your inbox.");
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground">
      <div className="flex items-center gap-2">
        <Mail className="size-4 shrink-0" />
        <span>Please verify your email address to write reviews and secure your account.</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleResend} disabled={isSending}>
          {isSending ? "Sending..." : "Resend email"}
        </Button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="text-accent-foreground/70 hover:text-accent-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
