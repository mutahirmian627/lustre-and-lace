import { eq } from "drizzle-orm";
import { db } from "./index";
import { platformSettings, user } from "./schema";
import { SETTINGS_DEFAULTS } from "@/constants/settings-keys";
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

async function main() {
  await seedPlatformSettings();
  await seedBootstrapAdmin();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
