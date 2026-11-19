import { NextResponse, type NextRequest } from "next/server";
import { getCookieCache, getSessionCookie } from "better-auth/cookies";
import { IS_SECURE_CONTEXT } from "@/lib/is-secure-context";
import { getRoleHome, isAdminRole, isSuperAdminRole } from "@/lib/roles";
import { SHOP_HOST, SHOP_ORIGIN, SHOP_PREFIX, stripShopPrefix } from "@/lib/shop-origin";
import { getSafeRedirect } from "@/utils/safe-redirect";

/**
 * Two jobs.
 *
 * 1. If the store has its own address (SHOP_ORIGIN, see lib/shop-origin.ts), route between the two addresses: on the store's
 *    address the clean paths are rewritten to the store's pages under /shop; the old /shop/... addresses go to the clean ones;
 *    the studio's pages go back to the main address. On the main address the store's pages go to the store's address.
 *
 * 2. Single enforcement point for /account/*, /admin/*, /super-admin/* (specs/03) and /checkout/*. Reads the signed session
 *    cookie cache rather than calling the full Better Auth server instance, so this stays Edge-safe and never pulls
 *    db/resend/cloudinary into the middleware bundle.
 *
 * The cache cookie only lives 5 minutes, while the session itself lasts 30 days. When the cache has lapsed but the session
 * cookie is still there, the visitor is still signed in: let them through and let the page's own server-side check (which asks
 * the database) make the final call. Treating a lapsed cache as "signed out" is what used to bounce people to the sign-in page
 * mid-checkout.
 */

/** On the store's own address these are not store pages: the API, and the admin panels (which live on both addresses). */
const NOT_STORE_PAGES = new Set(["api", "admin", "super-admin", "admin-not-found"]);

/** The store's picture for sharing is served from its real path on both addresses, with no redirect. */
const SHARE_IMAGE_PREFIX = `${SHOP_PREFIX}/opengraph-image`;

const MAIN_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

/** Decides where a request to a two-address site belongs. `path` is the page inside the app that should answer it. */
function routeBetweenAddresses(
  request: NextRequest,
  host: string,
  pathname: string,
  search: string
): { response: NextResponse } | { path: string } {
  const protocol = request.nextUrl.protocol;
  const onStoreAddress = host === SHOP_HOST;

  if (!onStoreAddress) {
    // The main address no longer hosts the store: its pages live on the store's address.
    if ((pathname === SHOP_PREFIX || pathname.startsWith(`${SHOP_PREFIX}/`)) && !pathname.startsWith(SHARE_IMAGE_PREFIX)) {
      return { response: NextResponse.redirect(new URL(`${stripShopPrefix(pathname)}${search}`, `${protocol}//${SHOP_HOST}`), 308) };
    }
    return { path: pathname };
  }

  const first = pathname.split("/")[1] ?? "";
  if (NOT_STORE_PAGES.has(first) || pathname.startsWith(SHARE_IMAGE_PREFIX)) return { path: pathname };

  // The studio belongs to the main address.
  if (first === "studio" && MAIN_ORIGIN) {
    return { response: NextResponse.redirect(new URL(`${pathname}${search}`, MAIN_ORIGIN), 308) };
  }

  // An old /shop/... address (a link, an email, a bookmark): the clean one is the same page.
  if (pathname === SHOP_PREFIX || pathname.startsWith(`${SHOP_PREFIX}/`)) {
    return { response: NextResponse.redirect(new URL(`${stripShopPrefix(pathname)}${search}`, request.url), 308) };
  }

  // A clean store address: answered by the store's real page.
  return { path: pathname === "/" ? SHOP_PREFIX : `${SHOP_PREFIX}${pathname}` };
}

/** The paths that need a look at the visitor's session. */
function isGuarded(path: string): boolean {
  return (
    path === "/shop/login" ||
    path === "/shop/register" ||
    path.startsWith("/super-admin") ||
    path.startsWith("/admin") ||
    path.startsWith("/shop/account") ||
    path.startsWith("/shop/checkout")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").toLowerCase();

  // `path` is the page inside the app that answers this request; it differs from what the visitor typed only on the store's own address.
  let path = pathname;
  if (SHOP_ORIGIN && SHOP_HOST) {
    const routed = routeBetweenAddresses(request, host, pathname, search);
    if ("response" in routed) return routed.response;
    path = routed.path;
  }
  const onStoreAddress = !!SHOP_HOST && host === SHOP_HOST;

  function proceed(headers?: Headers) {
    const init = headers ? { request: { headers } } : undefined;
    if (path === pathname) return NextResponse.next(init);
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.rewrite(url, init);
  }
  /** A path inside the app, as the visitor should be sent to it on this address. */
  const visible = (target: string) => (onStoreAddress ? stripShopPrefix(target) : target);

  if (!isGuarded(path)) return proceed();

  const cache = await getCookieCache(request, {
    secret: process.env.BETTER_AUTH_SECRET,
    isSecure: IS_SECURE_CONTEXT,
  });
  const hasSession = !!cache || !!getSessionCookie(request);
  // The cookie cache's user type doesn't include our additional `role` field.
  const role = (cache?.user as { role?: string } | undefined)?.role;

  // Someone who is already signed in has no use for the sign-in / sign-up pages:
  // send them to where their role works (admins to their panel).
  if (path === "/shop/login" || path === "/shop/register") {
    // Only page loads: the sign-in form calls server actions that POST to this same URL
    // right after the session cookie is set, and those must not be redirected away.
    if (!cache || request.method !== "GET") return proceed();
    const target = getSafeRedirect(request.nextUrl.searchParams.get("redirect")) ?? getRoleHome(role);
    return NextResponse.redirect(new URL(visible(target), request.url));
  }

  if (path.startsWith("/super-admin")) {
    if (!hasSession) {
      return redirectToLogin(request, onStoreAddress);
    }
    // Role is only known while the cache is fresh; otherwise the layout checks it against the database.
    if (cache && !isSuperAdminRole(role)) {
      return NextResponse.rewrite(new URL("/admin-not-found", request.url));
    }
    return proceed();
  }

  if (path.startsWith("/admin")) {
    if (!hasSession) {
      return redirectToLogin(request, onStoreAddress);
    }
    if (cache && !isAdminRole(role)) {
      // A login redirect here would itself confirm "/admin" is a protected
      // concept worth guessing at; a plain not-found reveals nothing.
      return NextResponse.rewrite(new URL("/admin-not-found", request.url));
    }
    return proceed();
  }

  // Ordering requires an account: checkout and its confirmation page are
  // behind login. placeOrder re-checks the session server-side, so this is
  // the friendly redirect, not the only enforcement.
  if (path.startsWith("/shop/account") || path.startsWith("/shop/checkout")) {
    if (!hasSession) {
      return redirectToLogin(request, onStoreAddress);
    }
    // Tell the page where it is, so its own sign-in check can send people back here afterwards.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", path + search);
    return proceed(requestHeaders);
  }

  return proceed();
}

function redirectToLogin(request: NextRequest, onStoreAddress: boolean) {
  const loginUrl = new URL(onStoreAddress ? "/login" : "/shop/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Every page and API route; not the build's own files, nor anything with a file extension (the pictures, icons and
  // fonts in public/). Most requests do nothing here: see isGuarded and routeBetweenAddresses.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
