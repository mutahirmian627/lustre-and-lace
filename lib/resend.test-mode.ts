import type { ReactElement } from "react";

export interface CapturedEmail {
  from: string;
  to: string | string[];
  subject: string;
  react: ReactElement;
  sentAt: Date;
}

const capturedEmails: CapturedEmail[] = [];

/**
 * Stand-in for the Resend client used when EMAIL_TEST_MODE=true (specs/16)
 * — captures what would have been sent instead of delivering it, so the
 * auth-verify-flow E2E test can assert on recipient/subject/content
 * without a real inbox. Same `.emails.send()` shape as the real client,
 * just the one method this codebase actually calls.
 */
export const testModeResend = {
  emails: {
    async send(params: { from: string; to: string | string[]; subject: string; react: ReactElement }) {
      capturedEmails.push({ ...params, sentAt: new Date() });
      return { data: { id: `test-mode-${capturedEmails.length}` }, error: null };
    },
  },
};

export function getCapturedEmails(): CapturedEmail[] {
  return capturedEmails;
}

export function getLastCapturedEmail(): CapturedEmail | undefined {
  return capturedEmails[capturedEmails.length - 1];
}

export function clearCapturedEmails(): void {
  capturedEmails.length = 0;
}
