import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  // Defense in depth — middleware.ts already guards /admin/* by role, but a
  // server component should never assume that guarantee blindly.
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-xl text-foreground">Lustre &amp; Lace Admin</h1>
      <div className="flex flex-col gap-6 md:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
