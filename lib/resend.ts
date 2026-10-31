import type { ReactElement } from "react";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { testModeResend } from "@/lib/resend.test-mode";

/** Narrowed to the one method every email template call site actually uses. */
export interface EmailSender {
  emails: {
    send(params: {
      from: string;
      to: string | string[];
      subject: string;
      react: ReactElement;
      replyTo?: string;
    }): Promise<unknown>;
  };
}

/**
 * SMTP alternative for when there's no domain to verify with Resend: set SMTP_HOST (plus
 * SMTP_PORT / SMTP_USER / SMTP_PASSWORD) and every email goes through that mailbox instead.
 * A Gmail account with an app password works and can email anyone. Failures are returned the
 * way Resend returns them (`{ error }`) rather than thrown, so callers behave the same.
 */
function createSmtpSender(): EmailSender {
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  return {
    emails: {
      async send({ from, to, subject, react, replyTo }) {
        try {
          const [html, text] = await Promise.all([render(react), render(react, { plainText: true })]);
          const info = await transport.sendMail({ from, to, subject, html, text, replyTo });
          return { data: { id: info.messageId }, error: null };
        } catch (error) {
          return { data: null, error: { message: error instanceof Error ? error.message : "SMTP send failed" } };
        }
      },
    },
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
    : process.env.SMTP_HOST
      ? createSmtpSender()
      : (() => {
          if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY environment variable is not set");
          }
          return new Resend(process.env.RESEND_API_KEY);
        })();

// Must be a domain verified in the Resend dashboard before launch — see
// specs/17-deployment.md pre-launch checklist.
export const FROM_EMAIL = process.env.FROM_EMAIL ?? "orders@example.lustreandlace.com";
