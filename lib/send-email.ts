import type { ReactElement } from "react";
import { resend, FROM_EMAIL, STUDIO_FROM_EMAIL, REPLY_TO_EMAIL } from "@/lib/resend";

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
  replyTo,
  sender = "store",
}: {
  to: string;
  subject: string;
  react: ReactElement;
  /** Verification / reset URL, printed only when the app runs on localhost and sending failed. */
  localLink?: string;
  /** Where a reply should go, e.g. the customer who filled in an enquiry form. */
  replyTo?: string;
  /** Whose email it is: the studio's (enquiries) or the demo store's (accounts, orders). Decides the From address. */
  sender?: "studio" | "store";
}): Promise<boolean> {
  try {
    const from = sender === "studio" ? STUDIO_FROM_EMAIL : FROM_EMAIL;
    const reply = replyTo ?? REPLY_TO_EMAIL;
    const result = (await resend.emails.send({ from, to, subject, react, ...(reply ? { replyTo: reply } : {}) })) as {
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
