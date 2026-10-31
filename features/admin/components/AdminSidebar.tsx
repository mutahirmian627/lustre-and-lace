"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Boxes,
  Ticket,
  Star,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useSupportUnread } from "@/features/admin/components/SupportUnreadProvider";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Enquiries", href: "/admin/inquiries", icon: Inbox },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Support", href: "/admin/support", icon: MessageSquare },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

export function AdminSidebar({
  isSuperAdmin = false,
  newInquiries = 0,
}: {
  isSuperAdmin?: boolean;
  newInquiries?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { count: supportUnread } = useSupportUnread();

  async function handleLogOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border pb-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4"
      aria-label="Admin navigation"
    >
      <Link href="/" className="mb-2 hidden shrink-0 items-center gap-1 px-3 text-sm text-muted-foreground hover:text-foreground md:flex">
        <ExternalLink className="size-3.5" />
        Back to site
      </Link>
      {isSuperAdmin && (
        <Link
          href="/super-admin"
          className="mb-2 flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-primary transition-colors hover:bg-muted"
        >
          <ShieldCheck className="size-4" />
          Super admin
        </Link>
      )}
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
            {href === "/admin/inquiries" && newInquiries > 0 && (
              <span
                aria-label={`${newInquiries} new enquir${newInquiries === 1 ? "y" : "ies"}`}
                className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground"
              >
                {newInquiries > 99 ? "99+" : newInquiries}
              </span>
            )}
            {href === "/admin/support" && supportUnread > 0 && (
              <span
                aria-label={`${supportUnread} unread message${supportUnread === 1 ? "" : "s"}`}
                className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-white"
              >
                {supportUnread > 99 ? "99+" : supportUnread}
              </span>
            )}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogOut}
        className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOut className="size-4" />
        Log Out
      </button>
    </nav>
  );
}
