/**
 * The demo store's own address, when it has one (adornments.aperionie.com).
 *
 * Set SHOP_ORIGIN (e.g. https://adornments.aperionie.com) and the store is served from that address with clean paths
 * (adornments.aperionie.com/products/..., not .../shop/products/...): middleware.ts rewrites each clean path to the store's real
 * page under /shop, sends the old /shop/... addresses (links, emails, bookmarks) to the clean ones, and sends everything else
 * that is not the store (the studio's pages) back to the main address. Left unset (local development, previews, tests) nothing
 * changes: the store stays under /shop on the one address.
 *
 * No imports, so middleware (Edge), server code and tests can all share it.
 */
export const SHOP_ORIGIN: string | null = process.env.SHOP_ORIGIN?.replace(/\/$/, "") || null;

/** host (with a port, if any) of SHOP_ORIGIN */
export const SHOP_HOST: string | null = SHOP_ORIGIN ? new URL(SHOP_ORIGIN).host : null;

/** The path as a visitor sees it on the store's own address: "/shop/products/x" becomes "/products/x", "/shop" becomes "/". */
export function stripShopPrefix(path: string): string {
  if (path === "/shop") return "/";
  return path.startsWith("/shop/") ? path.slice("/shop".length) : path;
}

/** Canonical path for a store page's metadata: clean when the store has its own address, as written otherwise. */
export function shopCanonical(path: string): string {
  return SHOP_ORIGIN ? stripShopPrefix(path) : path;
}

/** Where the store's real pages begin inside the app. */
export const SHOP_PREFIX = "/shop";
