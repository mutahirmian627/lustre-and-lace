/** Only same-site paths are allowed, so a crafted ?redirect= can't send someone to another domain after login. */
export function getSafeRedirect(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export function isCheckoutRedirect(redirect: string | null): boolean {
  return !!redirect && (redirect === "/checkout" || redirect.startsWith("/checkout/"));
}
