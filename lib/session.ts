import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Request-scoped: the layout, cart lookup, and wishlist lookup all need the session, but only the first call pays for it. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));
