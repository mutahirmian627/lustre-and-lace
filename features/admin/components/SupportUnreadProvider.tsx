"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { usePolling } from "@/hooks/use-polling";

const UNREAD_POLL_MS = 15_000;
const TITLE_PREFIX = /^\(\d+\)\s/;

interface SupportUnreadContextValue {
  count: number;
  /** Re-check right now — call after reading a conversation so the badge clears immediately. */
  refresh: () => Promise<void>;
}

const SupportUnreadContext = createContext<SupportUnreadContextValue | null>(null);

/**
 * Lives in the admin layout so the badge, the toast and the tab title all
 * work on every admin page, not just the inbox.
 */
export function SupportUnreadProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const previousCount = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/support/unread", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { count: number };
    setCount(data.count);

    // Stay quiet on the first read (page load) and while the inbox itself is open and showing the messages.
    const previous = previousCount.current;
    previousCount.current = data.count;
    if (previous !== null && data.count > previous && !pathnameRef.current.startsWith("/admin/support")) {
      toast("New message from a customer", {
        description: `${data.count} unread in Support`,
        action: { label: "Open inbox", onClick: () => router.push("/admin/support") },
      });
    }
  }, [router]);

  usePolling(refresh, UNREAD_POLL_MS);

  useEffect(() => {
    const base = document.title.replace(TITLE_PREFIX, "");
    document.title = count > 0 ? `(${count}) ${base}` : base;
  }, [count, pathname]);

  return <SupportUnreadContext.Provider value={{ count, refresh }}>{children}</SupportUnreadContext.Provider>;
}

export function useSupportUnread() {
  const context = useContext(SupportUnreadContext);
  if (!context) throw new Error("useSupportUnread must be used within a SupportUnreadProvider");
  return context;
}
