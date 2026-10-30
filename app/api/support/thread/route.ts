import { getSession } from "@/lib/session";
import { getUserThread } from "@/lib/support-queries";
import { noStoreJson } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** The signed-in customer's own conversation — never takes an id, so there's no way to ask for someone else's. */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return noStoreJson({ error: "Unauthorized" }, 401);
  return noStoreJson(await getUserThread(session.user.id));
}
