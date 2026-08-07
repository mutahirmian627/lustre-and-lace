import type { ReactElement } from "react";
import { Resend } from "resend";
import { testModeResend } from "@/lib/resend.test-mode";

/** Narrowed to the one method every email template call site actually uses. */
export interface EmailSender {
  emails: {
    send(params: { from: string; to: string | string[]; subject: string; react: ReactElement }): Promise<unknown>;
  };
}

/**
 * EMAIL_TEST_MODE swaps in an in-memory capture instead of a real Resend
 * client (specs/16) — the E2E auth-verify-flow test needs to assert on
 * email content without a real inbox, and CI shouldn't need a live
 * RESEND_API_KEY to run the suite at all.
 */
export const resend: EmailSender =
  process.env.EMAIL_TEST_MODE === "true"
    ? testModeResend
    : (() => {
        if (!process.env.RESEND_API_KEY) {
          throw new Error("RESEND_API_KEY environment variable is not set");
        }
        return new Resend(process.env.RESEND_API_KEY);
      })();

// Must be a domain verified in the Resend dashboard before launch — see
// specs/17-deployment.md pre-launch checklist.
export const FROM_EMAIL = process.env.FROM_EMAIL ?? "orders@example.lustreandlace.com";
