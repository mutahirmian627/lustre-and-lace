"use server";

import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { SETTINGS_KEYS, SETTINGS_DEFAULTS } from "@/constants/settings-keys";
import { platformSettingsFormSchema, type PlatformSettingsFormInput } from "@/features/admin/types";
import { isAdminRole } from "@/lib/roles";
import { SETTINGS_CACHE_TAG } from "@/lib/settings";
import { requireAdminUser } from "@/lib/require-admin";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !isAdminRole(session.user.role)) {
    throw new Error("Admin access required.");
  }
}

export async function getPlatformSettingsForForm(): Promise<PlatformSettingsFormInput> {
  await requireAdminUser();
  const rows = await db.query.platformSettings.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const get = (key: string) => byKey.get(key) ?? SETTINGS_DEFAULTS[key as keyof typeof SETTINGS_DEFAULTS];

  return {
    easypaisaNumber: get(SETTINGS_KEYS.easypaisaNumber),
    jazzcashNumber: get(SETTINGS_KEYS.jazzcashNumber),
    whatsappBusinessNumber: get(SETTINGS_KEYS.whatsappBusinessNumber),
    flatShippingRatePkr: Number(get(SETTINGS_KEYS.flatShippingRatePkr)),
    autoCancelUnpaidHours: Number(get(SETTINGS_KEYS.autoCancelUnpaidHours)),
  };
}

export async function updatePlatformSettings(input: PlatformSettingsFormInput): Promise<{ error: string } | { success: true }> {
  await requireAdmin();
  const parsed = platformSettingsFormSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };
  const data = parsed.data;

  const entries: [string, string][] = [
    [SETTINGS_KEYS.easypaisaNumber, data.easypaisaNumber],
    [SETTINGS_KEYS.jazzcashNumber, data.jazzcashNumber],
    [SETTINGS_KEYS.whatsappBusinessNumber, data.whatsappBusinessNumber],
    [SETTINGS_KEYS.flatShippingRatePkr, String(data.flatShippingRatePkr)],
    [SETTINGS_KEYS.autoCancelUnpaidHours, String(data.autoCancelUnpaidHours)],
  ];

  for (const [key, value] of entries) {
    await db
      .insert(platformSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: platformSettings.key, set: { value, updatedAt: new Date() } });
  }

  revalidatePath("/admin/settings");
  revalidateTag(SETTINGS_CACHE_TAG);
  return { success: true as const };
}
