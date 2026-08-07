import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { resend, FROM_EMAIL } from "@/lib/resend";
import VerifyEmail from "@/emails/verify-email";
import ResetPassword from "@/emails/reset-password";

const ONE_HOUR = 60 * 60;
const ONE_DAY = ONE_HOUR * 24;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  // Our schema already defaults every primary key to gen_random_uuid() at
  // the DB level (specs/02) — defer to that instead of having Better Auth
  // generate its own ids.
  advanced: {
    database: { generateId: false },
  },
  user: {
    additionalFields: {
      // Public sign-up can never set this — input: false means the field
      // is silently ignored on create/update payloads from the client, so
      // there's no request-body path to self-assign admin (specs/03).
      role: {
        type: ["customer", "admin"],
        input: false,
        defaultValue: "customer",
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Guest checkout must keep working, so verification is not a sign-in
    // gate — it's enforced separately at the /account/* and review-writing
    // boundaries (middleware.ts, actions/reviews.actions.ts).
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: "Reset your Lustre & Lace password",
        react: ResetPassword({ name: user.name, url }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: ONE_DAY,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: "Verify your email — Lustre & Lace",
        react: VerifyEmail({ name: user.name, url }),
      });
    },
  },
  session: {
    expiresIn: ONE_DAY * 30,
    updateAge: ONE_DAY,
    // Signed cookie cache so middleware.ts can read role for /admin/* checks
    // via getCookieCache() without a DB round trip on every request (and
    // without importing this whole server config into the Edge bundle).
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: true,
  },
});
