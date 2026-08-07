import { SiteShell } from "@/components/layout/SiteShell";
import { AccountSidebar } from "@/features/account/components/AccountSidebar";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <AccountSidebar />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </SiteShell>
  );
}
