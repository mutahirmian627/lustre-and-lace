import { getAdminUser } from "@/lib/require-admin";
import { getAdminUnreadTotal } from "@/lib/support-queries";
import { noStoreJson } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminUser())) return noStoreJson({ error: "Not found" }, 404);
  return noStoreJson({ count: await getAdminUnreadTotal() });
}
