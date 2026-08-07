"use server";

import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { auth } from "@/lib/auth";

/**
 * Minimal slice for checkout's saved-address selector and "save this
 * address" checkbox. Full CRUD (edit, delete, set-default) belongs to the
 * Account milestone (specs/12) — this only covers what checkout needs now.
 */
export async function getSavedAddresses() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return db.query.addresses.findMany({
    where: eq(addresses.userId, session.user.id),
    orderBy: [desc(addresses.isDefault), desc(addresses.updatedAt)],
  });
}

export async function saveAddressFromCheckout(input: {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  province?: string;
  postalCode?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return;

  await db.insert(addresses).values({
    userId: session.user.id,
    fullName: input.fullName,
    phone: input.phone,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    city: input.city,
    province: input.province,
    postalCode: input.postalCode,
  });
}
