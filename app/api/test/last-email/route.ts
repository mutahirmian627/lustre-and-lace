import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { getLastCapturedEmail, clearCapturedEmails } from "@/lib/resend.test-mode";

/**
 * Test-only inspection endpoint (specs/16) — Playwright drives the app as
 * a separate process from the server, so the auth-verify-flow E2E test
 * needs some way to read what lib/resend.ts's test-mode mock captured in
 * the server's memory. Gated on EMAIL_TEST_MODE so this route does nothing
 * (404) outside the test environment — it's never wired into a real
 * deployment's env vars.
 */
export async function GET() {
  if (process.env.EMAIL_TEST_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = getLastCapturedEmail();
  if (!email) {
    return NextResponse.json({ error: "No email captured yet." }, { status: 404 });
  }

  return NextResponse.json({
    from: email.from,
    to: email.to,
    subject: email.subject,
    html: await render(email.react),
    sentAt: email.sentAt,
  });
}

export async function DELETE() {
  if (process.env.EMAIL_TEST_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  clearCapturedEmails();
  return NextResponse.json({ success: true });
}
