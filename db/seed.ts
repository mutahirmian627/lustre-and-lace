import { eq } from "drizzle-orm";
import { db } from "./index";
import { account, faqs, platformSettings, user } from "./schema";
import { SETTINGS_DEFAULTS } from "@/constants/settings-keys";
import { SITE_POLICIES } from "@/constants/site-config";
import { auth } from "@/lib/auth";

async function seedPlatformSettings() {
  for (const [key, value] of Object.entries(SETTINGS_DEFAULTS)) {
    await db
      .insert(platformSettings)
      .values({ key, value })
      .onConflictDoNothing({ target: platformSettings.key });
  }
  console.log(`Seeded ${Object.keys(SETTINGS_DEFAULTS).length} platform settings.`);
}

/**
 * The only path to a first admin: public sign-up can never set role
 * (additionalFields.role.input is false, specs/03), so this goes through
 * Better Auth's own sign-up flow for correct password hashing, then
 * promotes the row directly — the one place that's allowed to bypass the
 * "no self-assigned admin" rule.
 */
async function seedBootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@lustreandlace.com";
  const password = process.env.ADMIN_PASSWORD ?? "change-this-password-1";

  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (existing) {
    console.log(`Bootstrap admin already exists (${email}), skipping.`);
    return;
  }

  await auth.api.signUpEmail({
    body: { name: "Admin", email, password },
  });
  await db
    .update(user)
    .set({ role: "admin", emailVerified: true })
    .where(eq(user.email, email));

  console.log(
    `Created bootstrap admin ${email} — change ADMIN_PASSWORD and re-run, or change the password after first login.`
  );
}

/**
 * The one super admin: the only role that can promote or remove admins. Written
 * straight to the database (no sign-up email is sent to a mailbox that may not
 * exist) with the same password hashing Better Auth uses. A database trigger
 * guarantees there is never more than one.
 */
async function seedSuperAdmin() {
  const existing = await db.query.user.findFirst({ where: eq(user.role, "super_admin") });
  if (existing) {
    console.log(`Super admin already exists (${existing.email}), skipping.`);
    return;
  }

  const email = (process.env.SUPER_ADMIN_EMAIL ?? "superadmin@lustreandlace.com").toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Set SUPER_ADMIN_PASSWORD (at least 12 characters) in .env.local before seeding the super admin.");
  }

  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(password);

  const match = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (match) {
    // The address is already registered: promote it and set the password it will sign in with.
    await db.update(user).set({ role: "super_admin", emailVerified: true }).where(eq(user.id, match.id));
    await db.update(account).set({ password: passwordHash }).where(eq(account.userId, match.id));
    console.log(`Promoted existing account ${email} to super admin.`);
    return;
  }

  const [created] = await db
    .insert(user)
    .values({ name: "Super Admin", email, emailVerified: true, role: "super_admin" })
    .returning({ id: user.id });
  await db.insert(account).values({
    userId: created.id,
    accountId: created.id,
    providerId: "credential",
    password: passwordHash,
  });
  console.log(`Created super admin ${email}.`);
}

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

/**
 * Starter quick answers for the chat widget — only inserted into an empty
 * table, so answers an admin has edited or removed are never brought back.
 * Shipping/returns reuse the exact policy text already shown on product pages.
 */
async function seedStarterFaqs() {
  const existing = await db.select({ id: faqs.id }).from(faqs).limit(1);
  if (existing.length > 0) {
    console.log("Quick answers already exist, skipping.");
    return;
  }

  const starter = [
    {
      question: "How long does delivery take?",
      answer: oneLine(SITE_POLICIES.shipping),
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We offer Cash on Delivery nationwide, or bank transfer to our EasyPaisa or JazzCash number. For transfers, send a screenshot of the payment on WhatsApp with your order reference and we'll confirm it.",
    },
    {
      question: "How much is shipping?",
      answer: "Shipping is a flat rate, shown at checkout before you place your order.",
    },
    {
      question: "What is your return policy?",
      answer: oneLine(SITE_POLICIES.returns),
    },
    {
      question: "How can I track my order?",
      answer:
        "Type your order number (it looks like LL-2026-00013) into this chat and I'll show you its status, no sign-in needed. You can also sign in and open your account, then Orders, to see every order you've placed.",
    },
    {
      question: "Do I need an account to order?",
      answer:
        "Yes, you'll need a free account to place an order so your order history and updates are kept in one place. Your cart is saved when you sign in or register.",
    },
  ];

  await db.insert(faqs).values(starter.map((faq, index) => ({ ...faq, displayOrder: index })));
  console.log(`Seeded ${starter.length} starter quick answers.`);
}

async function main() {
  await seedPlatformSettings();
  await seedStarterFaqs();
  await seedBootstrapAdmin();
  await seedSuperAdmin();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
