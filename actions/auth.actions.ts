"use server";

import { getSession } from "@/lib/session";
import { getRoleHome, isAdminRole, isSuperAdminRole } from "@/lib/roles";
import { getSafeRedirect } from "@/utils/safe-redirect";

/**
 * Where to send someone right after they sign in. Admins always land in their
 * panel (unless they were heading to another page inside it); customers go back
 * to where they were or the home page.
 */
export async function getPostLoginPath(redirect: string | null): Promise<string> {
  const session = await getSession();
  const role = session?.user?.role;
  const safe = getSafeRedirect(redirect);

  if (isAdminRole(role)) {
    const inOwnArea =
      !!safe && (safe.startsWith("/admin") || (isSuperAdminRole(role) && safe.startsWith("/super-admin")));
    return inOwnArea ? safe : getRoleHome(role);
  }
  return safe ?? "/";
}
