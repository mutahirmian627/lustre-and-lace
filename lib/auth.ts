import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail } from "@/lib/send-email";
import VerifyEmail from "@/emails/verify-email";
import ResetPassword from "@/emails/reset-password";
import { SHOP_HOST, SHOP_ORIGIN } from "@/lib/shop-origin";

const ONE_HOUR = 60 * 60;
const ONE_DAY = ONE_HOUR * 24;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // The store has its own address (see lib/shop-origin.ts): sign-in requests come from it too, so it must be trusted, and the
  // session cookie is shared across the studio's and the store's subdomains so the admin panel works on both. (On localhost,
  // used by tests, the cookie stays on the one host.)
  trustedOrigins: SHOP_ORIGIN ? [SHOP_ORIGIN] : [],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  // Our schema already defaults every primary key to gen_random_uuid() at
  // the DB level (specs/02) — defer to that instead of having Better Auth
  // generate its own ids.
  advanced: {
    database: { generateId: false },
    ...(SHOP_HOST && !/(^|\.)localhost(:\d+)?$/.test(SHOP_HOST) ? { crossSubDomainCookies: { enabled: true } } : {}),
  },
  user: {
    additionalFields: {
      // Public sign-up can never set this — input: false means the field
      // is silently ignored on create/update payloads from the client, so
      // there's no request-body path to self-assign admin (specs/03).
      role: {
        type: ["customer", "admin", "super_admin"],
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
    // A new account can't sign in until its email is confirmed, so every
    // account (and every order) is tied to a mailbox that really exists.
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Aperionie Adornments password",
        react: ResetPassword({ name: user.name, url }),
        localLink: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: ONE_DAY,
    // Sign-in stays a separate step after verifying, so the guest cart merges
    // through the normal login flow.
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email — Aperionie Adornments",
        react: VerifyEmail({ name: user.name, url }),
        localLink: url,
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
