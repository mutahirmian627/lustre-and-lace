/**
 * Whether the app is actually served over HTTPS, derived from the
 * configured base URL rather than NODE_ENV. Better Auth's own cookie
 * writer already does this internally; anything that reads or writes an
 * auth-adjacent cookie outside of that (middleware's getCookieCache, the
 * guest cart cookie) needs to derive it the same way, or a production
 * build served over plain HTTP — this project's own Playwright suite, for
 * one — ends up looking for a `__Secure-`-prefixed cookie name that was
 * never set. No Node-only imports: middleware.ts needs this Edge-safe.
 */
export const IS_SECURE_CONTEXT = (
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  ""
).startsWith("https://");
