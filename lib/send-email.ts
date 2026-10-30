import type { ReactElement } from "react";
import { resend, FROM_EMAIL } from "@/lib/resend";

/**
 * Sends one email and never throws: the Resend SDK reports failures in its
 * return value (not as exceptions), so an unchecked call would silently drop
 * the message. Failures are logged; on a local machine the action link is
 * logged too, so sign-up can still be completed before Resend is configured.
 */
export async function sendEmail({
  to,
  subject,
  react,
  localLink,
}: {
  to: string;
  subject: string;
  react: ReactElement;
  /** Verification / reset URL, printed only when the app runs on localhost and sending failed. */
  localLink?: string;
}): Promise<boolean> {
  try {
    const result = (await resend.emails.send({ from: FROM_EMAIL, to, subject, react })) as {
      error?: { message?: string } | null;
    } | null;
    if (result?.error) throw new Error(result.error.message ?? "Resend rejected the email");
    return true;
  } catch (error) {
    console.error(`[email] Could not send "${subject}" to ${to}:`, error instanceof Error ? error.message : error);
    if (localLink && (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("http://localhost")) {
      console.warn(`[email] Local-only link for ${to}: ${localLink}`);
    }
    return false;
  }
}
