"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

const COOLDOWN_SECONDS = 60;

/** Re-sends the verification link, with a cooldown so it can't be hammered into a mail flood. */
export function ResendVerificationButton({
  email,
  variant = "outline",
  className,
}: {
  email: string;
  variant?: "outline" | "link";
  className?: string;
}) {
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    setSending(true);
    setMessage(null);
    const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/shop/verify-email" });
    setSending(false);
    if (error) {
      setMessage({ text: error.message ?? "We couldn't send the email. Try again in a moment.", isError: true });
      return;
    }
    setMessage({ text: "Sent. Check your inbox (and your spam folder).", isError: false });
    setCooldown(COOLDOWN_SECONDS);
  }

  return (
    <div className={className}>
      <Button type="button" variant={variant} onClick={resend} disabled={sending || cooldown > 0}>
        {sending ? "Sending..." : cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
      </Button>
      {message && (
        <p role="status" className={`mt-2 text-sm ${message.isError ? "text-destructive" : "text-muted-foreground"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
