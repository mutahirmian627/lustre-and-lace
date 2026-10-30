import type { NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/require-admin";
import { getAdminThread } from "@/lib/support-queries";
import { noStoreJson } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) return noStoreJson({ error: "Not found" }, 404);

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return noStoreJson({ error: "Not found" }, 404);

  const thread = await getAdminThread(id);
  if (!thread) return noStoreJson({ error: "Not found" }, 404);
  return noStoreJson(thread);
}
