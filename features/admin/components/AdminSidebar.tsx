"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Boxes,
  Ticket,
  Star,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

export function AdminSidebar() {
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
      aria-label="Admin navigation"
    >
      <Link href="/" className="mb-2 hidden shrink-0 items-center gap-1 px-3 text-sm text-muted-foreground hover:text-foreground md:flex">
        <ExternalLink className="size-3.5" />
        Back to site
      </Link>
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
