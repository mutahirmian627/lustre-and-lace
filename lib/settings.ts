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

export async function getFlatShippingRate(): Promise<number> {
  const value = await getSetting(SETTINGS_KEYS.flatShippingRatePkr);
  return Number(value);
}
