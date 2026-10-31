import { NextResponse, type NextRequest } from "next/server";
import { getCookieCache, getSessionCookie } from "better-auth/cookies";
import { IS_SECURE_CONTEXT } from "@/lib/is-secure-context";
import { getRoleHome, isAdminRole, isSuperAdminRole } from "@/lib/roles";
import { getSafeRedirect } from "@/utils/safe-redirect";

/**
 * Single enforcement point for /account/*, /admin/*, /super-admin/* (specs/03) and /checkout/*.
 * Reads the signed session cookie cache rather than calling the full Better Auth
 * server instance, so this stays Edge-safe and never pulls db/resend/
 * cloudinary into the middleware bundle.
 *
 * The cache cookie only lives 5 minutes, while the session itself lasts 30 days. When the cache has
 * lapsed but the session cookie is still there, the visitor is still signed in: let them through and
 * let the page's own server-side check (which asks the database) make the final call. Treating a
 * lapsed cache as "signed out" is what used to bounce people to the sign-in page mid-checkout.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const cache = await getCookieCache(request, {
    secret: process.env.BETTER_AUTH_SECRET,
    isSecure: IS_SECURE_CONTEXT,
  });
  const hasSession = !!cache || !!getSessionCookie(request);
  // The cookie cache's user type doesn't include our additional `role` field.
  const role = (cache?.user as { role?: string } | undefined)?.role;

  // Someone who is already signed in has no use for the sign-in / sign-up pages:
  // send them to where their role works (admins to their panel).
  if (pathname === "/login" || pathname === "/register") {
    // Only page loads: the sign-in form calls server actions that POST to this same URL
    // right after the session cookie is set, and those must not be redirected away.
    if (!cache || request.method !== "GET") return NextResponse.next();
    const target = getSafeRedirect(request.nextUrl.searchParams.get("redirect")) ?? getRoleHome(role);
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (pathname.startsWith("/super-admin")) {
    if (!hasSession) {
      return redirectToLogin(request);
    }
    // Role is only known while the cache is fresh; otherwise the layout checks it against the database.
    if (cache && !isSuperAdminRole(role)) {
      return NextResponse.rewrite(new URL("/admin-not-found", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      return redirectToLogin(request);
    }
    if (cache && !isAdminRole(role)) {
      // A login redirect here would itself confirm "/admin" is a protected
      // concept worth guessing at; a plain not-found reveals nothing.
      return NextResponse.rewrite(new URL("/admin-not-found", request.url));
    }
    return NextResponse.next();
  }

  // Ordering requires an account: checkout and its confirmation page are
  // behind login. placeOrder re-checks the session server-side, so this is
  // the friendly redirect, not the only enforcement.
  if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
    if (!hasSession) {
      return redirectToLogin(request);
    }
    // Tell the page where it is, so its own sign-in check can send people back here afterwards.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname + search);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/super-admin/:path*", "/checkout/:path*", "/login", "/register"],
};
