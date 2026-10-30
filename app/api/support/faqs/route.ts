import { NextResponse } from "next/server";
import { getActiveFaqs } from "@/lib/support-queries";

/** Public on purpose: quick answers need no account and contain nothing account-specific. */
export async function GET() {
  const faqs = await getActiveFaqs();
  return NextResponse.json(
    { faqs },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
