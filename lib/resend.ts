import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Must be a domain verified in the Resend dashboard before launch — see
// specs/17-deployment.md pre-launch checklist.
export const FROM_EMAIL = process.env.FROM_EMAIL ?? "orders@example.lustreandlace.com";
