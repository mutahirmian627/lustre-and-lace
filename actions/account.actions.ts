"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user, addresses, verification } from "@/db/schema";
import { auth } from "@/lib/auth";
import { resend, FROM_EMAIL } from "@/lib/resend";
import ConfirmAccountDeletion from "@/emails/confirm-account-deletion";

const PK_PHONE_REGEX = /^(\+92|0)3\d{9}$/;
const ACCOUNT_DELETION_IDENTIFIER_PREFIX = "account-deletion:";
const ACCOUNT_DELETION_TOKEN_TTL_MS = 60 * 60 * 1000;

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(PK_PHONE_REGEX, "Enter a valid Pakistani phone number")
    .optional()
    .or(z.literal("")),
});

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "You must be signed in." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };

  await db
    .update(user)
    .set({ name: parsed.data.name, phone: parsed.data.phone || null, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  revalidatePath("/account");
  revalidatePath("/account/settings");
  return { success: true as const };
}

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  fullName: z.string().min(2, "Enter a full name"),
  phone: z.string().regex(PK_PHONE_REGEX, "Enter a valid Pakistani phone number"),
  addressLine1: z.string().min(3, "Enter an address"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Enter a city"),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export async function getAddresses() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  return db.query.addresses.findMany({
    where: eq(addresses.userId, session.user.id),
    orderBy: [desc(addresses.isDefault), desc(addresses.createdAt)],
  });
}

/**
 * Setting a new default must atomically unset any previous one — two writes
 * in one db.batch() call, the same neon-http atomicity workaround used by
 * placeOrder/cancelOrder (specs/10, specs/11), so a crash mid-way never
 * leaves two rows marked default.
 */
async function swapDefaultAddress(userId: string, newDefaultId: string) {
  await db.batch([
    db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId)),
    db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, newDefaultId)),
  ]);
}

export async function addAddress(input: AddressInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "You must be signed in." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };

  const [created] = await db
    .insert(addresses)
    .values({ userId: session.user.id, ...parsed.data })
    .returning();

  if (parsed.data.isDefault) {
    await swapDefaultAddress(session.user.id, created.id);
  }

  revalidatePath("/account/addresses");
  return { success: true as const };
}

export async function updateAddress(addressId: string, input: AddressInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "You must be signed in." };

  const existing = await db.query.addresses.findFirst({ where: eq(addresses.id, addressId) });
  if (!existing || existing.userId !== session.user.id) return { error: "Address not found." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form for errors." };

  await db.update(addresses).set(parsed.data).where(eq(addresses.id, addressId));

  if (parsed.data.isDefault) {
    await swapDefaultAddress(session.user.id, addressId);
  }

  revalidatePath("/account/addresses");
  return { success: true as const };
}

export async function deleteAddress(addressId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "You must be signed in." };

  const existing = await db.query.addresses.findFirst({ where: eq(addresses.id, addressId) });
  if (!existing || existing.userId !== session.user.id) return { error: "Address not found." };

  // orders.shippingAddress is an immutable snapshot (specs/02/specs/10), so
  // past orders are entirely unaffected by deleting the saved address row
  // they originated from.
  await db.delete(addresses).where(eq(addresses.id, addressId));

  revalidatePath("/account/addresses");
  return { success: true as const };
}

export async function setDefaultAddress(addressId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "You must be signed in." };

  const existing = await db.query.addresses.findFirst({ where: eq(addresses.id, addressId) });
  if (!existing || existing.userId !== session.user.id) return { error: "Address not found." };

  await swapDefaultAddress(session.user.id, addressId);

  revalidatePath("/account/addresses");
  return { success: true as const };
}

/**
 * Reuses Better Auth's own `verification` table as the token store rather
 * than building a second token system (specs/12) — same table backing email
 * verification and password reset, just a different `identifier` prefix.
 */
export async function requestAccountDeletion() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "You must be signed in." };

  const token = crypto.randomUUID();
  await db.insert(verification).values({
    identifier: `${ACCOUNT_DELETION_IDENTIFIER_PREFIX}${session.user.id}`,
    value: token,
    expiresAt: new Date(Date.now() + ACCOUNT_DELETION_TOKEN_TTL_MS),
  });

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/account/delete-confirm?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: session.user.email,
    subject: "Confirm Account Deletion — Lustre & Lace",
    react: ConfirmAccountDeletion({ name: session.user.name, url }),
  });

  return { success: true as const };
}

/** Read-only check used by the delete-confirm page to decide what to render, without consuming the token. */
export async function isAccountDeletionTokenValid(token: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return false;

  const row = await db.query.verification.findFirst({
    where: and(
      eq(verification.identifier, `${ACCOUNT_DELETION_IDENTIFIER_PREFIX}${session.user.id}`),
      eq(verification.value, token)
    ),
  });
  return !!row && row.expiresAt > new Date();
}

/**
 * Hard-deletes the user row (specs/12). session/account/wishlists/addresses/
 * cartItems/carts/reviews all cascade-delete per their FKs; orders.userId
 * uses `set null`, so order history survives as anonymized records —
 * deleting an account doesn't erase the business's purchase history.
 */
export async function confirmAccountDeletion(token: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "You must be signed in to confirm this." };

  const identifier = `${ACCOUNT_DELETION_IDENTIFIER_PREFIX}${session.user.id}`;
  const row = await db.query.verification.findFirst({
    where: and(eq(verification.identifier, identifier), eq(verification.value, token)),
  });
  if (!row || row.expiresAt < new Date()) {
    return { error: "This link is invalid or has expired." };
  }

  await db.delete(verification).where(eq(verification.identifier, identifier));
  await db.delete(user).where(eq(user.id, session.user.id));

  return { success: true as const };
}
