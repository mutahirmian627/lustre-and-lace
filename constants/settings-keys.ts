/**
 * Keys stored in platformSettings (db/schema/settings.ts). Centralized here
 * so every reader/writer (cart shipping calc, checkout payment instructions,
 * the auto-cancel cron, the admin Settings form) references the same string
 * instead of retyping it.
 */
export const SETTINGS_KEYS = {
  easypaisaNumber: "easypaisa_number",
  jazzcashNumber: "jazzcash_number",
  whatsappBusinessNumber: "whatsapp_business_number",
  flatShippingRatePkr: "flat_shipping_rate_pkr",
  autoCancelUnpaidHours: "auto_cancel_unpaid_hours",
} as const;

export type SettingsKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];

/** Seed defaults — also the fallback if a key is ever missing at runtime. */
export const SETTINGS_DEFAULTS: Record<SettingsKey, string> = {
  [SETTINGS_KEYS.easypaisaNumber]: "03XX-XXXXXXX",
  [SETTINGS_KEYS.jazzcashNumber]: "03XX-XXXXXXX",
  [SETTINGS_KEYS.whatsappBusinessNumber]: "923XXXXXXXXX",
  [SETTINGS_KEYS.flatShippingRatePkr]: "250",
  [SETTINGS_KEYS.autoCancelUnpaidHours]: "48",
};
