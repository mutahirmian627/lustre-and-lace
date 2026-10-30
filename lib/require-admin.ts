import { getSession } from "@/lib/session";
import { isAdminRole } from "@/lib/roles";

/** For route handlers: null means "not an admin" so the caller can return a 404/401 instead of throwing. */
export async function getAdminUser() {
  const session = await getSession();
  if (!session?.user || !isAdminRole(session.user.role)) return null;
  return session.user;
}

/** For server actions: throws, matching the requireAdmin helper in the other admin actions. */
export async function requireAdminUser() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Admin access required.");
  return admin;
}
