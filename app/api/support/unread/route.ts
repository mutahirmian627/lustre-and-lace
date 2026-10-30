import { getSession } from "@/lib/session";
import { getUserUnreadCount } from "@/lib/support-queries";
import { noStoreJson } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return noStoreJson({ count: 0 });
  return noStoreJson({ count: await getUserUnreadCount(session.user.id) });
}
