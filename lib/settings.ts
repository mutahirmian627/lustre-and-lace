import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { SETTINGS_DEFAULTS, SETTINGS_KEYS, type SettingsKey } from "@/constants/settings-keys";

/** Falls back to the seed default if a key is ever missing at runtime. */
export async function getSetting(key: SettingsKey): Promise<string> {
  const row = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.key, key),
  });
  return row?.value ?? SETTINGS_DEFAULTS[key];
}

export const SETTINGS_CACHE_TAG = "platform-settings";

/**
 * Display-only (the cart badge/summary on every page), so it's cached rather than costing a
 * database round trip per visit. Checkout reads the live value with getSetting, and saving
 * settings in the admin clears this cache.
 */
export const getFlatShippingRate = unstable_cache(
  async (): Promise<number> => Number(await getSetting(SETTINGS_KEYS.flatShippingRatePkr)),
  ["flat-shipping-rate"],
  { tags: [SETTINGS_CACHE_TAG], revalidate: 300 }
);

/** Display-only (studio footer and enquiry page), cached like the shipping rate; saving settings clears it. */
export const getWhatsAppNumber = unstable_cache(
  async (): Promise<string> => getSetting(SETTINGS_KEYS.whatsappBusinessNumber),
  ["whatsapp-business-number"],
  { tags: [SETTINGS_CACHE_TAG], revalidate: 300 }
);
