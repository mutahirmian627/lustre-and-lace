"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, History, Store, LogOut, ExternalLink } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/super-admin", icon: LayoutDashboard },
  { label: "Customers", href: "/super-admin/customers", icon: Users },
  { label: "Admins", href: "/super-admin/admin", icon: ShieldCheck },
  { label: "Activity", href: "/super-admin/activity", icon: History },
] as const;

const LINK_CLASS =
  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors";

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border pb-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4"
      aria-label="Super admin navigation"
    >
      <Link href="/" className="mb-2 hidden shrink-0 items-center gap-1 px-3 text-sm text-muted-foreground hover:text-foreground md:flex">
        <ExternalLink className="size-3.5" />
        Back to site
      </Link>
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive = href === "/super-admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              LINK_CLASS,
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
      <Link href="/admin" className={cn(LINK_CLASS, "text-muted-foreground hover:bg-muted hover:text-foreground md:mt-2 md:border-t md:border-border md:pt-3")}>
        <Store className="size-4" />
        Store admin
      </Link>
      <button
        type="button"
        onClick={handleLogOut}
        className={cn(LINK_CLASS, "text-muted-foreground hover:bg-muted hover:text-foreground")}
      >
        <LogOut className="size-4" />
        Log Out
      </button>
    </nav>
  );
}
