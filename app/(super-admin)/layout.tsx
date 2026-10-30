import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isSuperAdminRole } from "@/lib/roles";
import { SuperAdminSidebar } from "@/features/super-admin/components/SuperAdminSidebar";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Defense in depth, like the admin layout: middleware already guards /super-admin/*.
  if (!session?.user || !isSuperAdminRole(session.user.role)) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-xl text-foreground">Lustre &amp; Lace Super Admin</h1>
      <div className="flex flex-col gap-6 md:flex-row">
        <SuperAdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
