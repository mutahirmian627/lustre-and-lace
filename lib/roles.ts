/**
 * Role helpers with no imports, so middleware (Edge), server code and client
 * components can all share them. `super_admin` is a strict superset of
 * `admin`: there is exactly one, and only they can change who is an admin.
 */
export type Role = "customer" | "admin" | "super_admin";

/** Admin or super admin: may use the store admin panel. */
export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === "super_admin";
}

/** Where each role lands after signing in, and what the header's panel link points to. */
export function getRoleHome(role: string | null | undefined): string {
  if (role === "super_admin") return "/super-admin";
  if (role === "admin") return "/admin";
  return "/account";
}

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  admin: "Admin",
  super_admin: "Super admin",
};
