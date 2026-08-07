import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Small key-value settings store, introduced specifically to back the
 * Admin Dashboard's Settings section (specs/13). Resolves several items
 * that were previously hardcoded constants flagged as "fast-follow once
 * a settings table exists" (specs/10, specs/11):
 *   - "easypaisa_number"
 *   - "jazzcash_number"
 *   - "whatsapp_business_number"
 *   - "flat_shipping_rate_pkr"
 *   - "auto_cancel_unpaid_hours"
 *
 * Deliberately NOT used for brand/visual identity (colors, fonts, tagline)
 * — those remain code-level (Tailwind config / constants), since they're
 * a design-system concern, not a runtime business setting an admin should
 * casually change from a form.
 *
 * `value` is stored as text; callers parse to number/etc. as needed per key.
 * A seed script should insert sensible defaults for every key above on
 * first setup, so the app never has to guess at a missing setting.
 */
export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
