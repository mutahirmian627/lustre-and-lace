import { NextResponse } from "next/server";

/** Polled endpoints must never be served from a cache — a stale unread count is a missed message. */
export function noStoreJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
