import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Request-scoped: the layout, cart lookup, and wishlist lookup all need the session, but only the first call pays for it. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/**
 * Server-side half of the sign-in gate for account and checkout pages. The middleware lets anyone
 * holding a session cookie through (it can't tell an expired session from a live one without the
 * database), so this is where a truly expired session is sent back to sign in, returning here after.
 */
export async function requireSessionOrRedirect() {
  const session = await getSession();
  if (!session?.user) {
    const path = (await headers()).get("x-pathname") ?? "/shop/account";
    redirect(`/shop/login?redirect=${encodeURIComponent(path)}`);
  }
  return session;
}
