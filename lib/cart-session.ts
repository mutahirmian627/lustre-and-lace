import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { carts } from "@/db/schema";
import { auth } from "@/lib/auth";

export const GUEST_CART_COOKIE = "guest_cart_token";

/**
 * Resolves the current cart id — by userId when logged in, by a guest
 * cookie otherwise, creating whichever is missing. This is the "get or
 * create a cart" primitive both the PDP's Add to Cart button and the full
 * Cart milestone (specs/09) build on; guest/login merge behavior is added
 * there, not here.
 */
export async function getOrCreateCartId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    const existing = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
    });
    if (existing) return existing.id;

    const [created] = await db
      .insert(carts)
      .values({ userId: session.user.id })
      .returning();
    return created.id;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_CART_COOKIE)?.value;

  if (token) {
    const existing = await db.query.carts.findFirst({
      where: eq(carts.guestToken, token),
    });
    if (existing) return existing.id;
  }

  const newToken = randomUUID();
  const [created] = await db
    .insert(carts)
    .values({ guestToken: newToken })
    .returning();

  cookieStore.set(GUEST_CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return created.id;
}

/** Read-only lookup for display purposes (e.g. the header badge) — never creates a cart. */
export async function getExistingCartId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user) {
    const existing = await db.query.carts.findFirst({
      where: eq(carts.userId, session.user.id),
    });
    return existing?.id ?? null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!token) return null;

  const existing = await db.query.carts.findFirst({
    where: eq(carts.guestToken, token),
  });
  return existing?.id ?? null;
}
