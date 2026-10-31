"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Heart, MapPin, Settings, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/account", icon: LayoutDashboard },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Settings", href: "/account/settings", icon: Settings },
] as const;

/**
 * Persistent account nav (specs/12). Renders as a left sidebar on desktop
 * and a horizontal scrollable tab bar on mobile — account navigation is
 * used often enough within a session that it shouldn't cost an extra tap
 * to reveal, so it's never collapsed behind a hamburger.
 */
export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogOut() {
    await signOut();
    router.push("/shop");
    router.refresh();
  }

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-2 md:w-56 md:flex-col md:overflow-visible md:pb-0"
      aria-label="Account navigation"
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive = href === "/account" ? pathname === href : pathname.startsWith(href);
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
