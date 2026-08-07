import { NextResponse, type NextRequest } from "next/server";
import { getCookieCache } from "better-auth/cookies";

/**
 * Single enforcement point for /account/* and /admin/* (specs/03). Reads the
 * signed session cookie cache rather than calling the full Better Auth
 * server instance, so this stays Edge-safe and never pulls db/resend/
 * cloudinary into the middleware bundle.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cache = await getCookieCache(request, {
    secret: process.env.BETTER_AUTH_SECRET,
  });

  if (pathname.startsWith("/admin")) {
    if (!cache) {
      return redirectToLogin(request);
    }
    if (cache.user.role !== "admin") {
      // A login redirect here would itself confirm "/admin" is a protected
      // concept worth guessing at; a plain not-found reveals nothing.
      return NextResponse.rewrite(new URL("/admin-not-found", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    if (!cache) {
      return redirectToLogin(request);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
