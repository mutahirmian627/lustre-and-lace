"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { setMenuOpen, useMenuOpen } from "@/features/immersive/lib/menu-store";
import { whenNeeded } from "@/features/immersive/lib/when-needed";
import { cn } from "@/lib/utils";

// The menu (and the animation library it uses) is not needed to show the page. It is fetched once the
// browser is idle, or the moment someone reaches for the Menu button, whichever comes first.
const MenuOverlay = dynamic(() => import("@/features/immersive/nav/MenuOverlay").then((m) => m.MenuOverlay), {
  ssr: false,
});

// A stable function (not recreated per render) so the overlay's effects don't re-run needlessly.
const closeMenu = () => setMenuOpen(false);

/**
 * The bar across the top: Menu on the left, the wordmark in the middle, "Start a project" on the right.
 *
 * It stays fixed so the way to enquire is always one tap away, and takes its colours from the page's
 * atmosphere, so it reads on warm paper and on plum night alike. Once the page has scrolled it gains a
 * soft frosted backdrop so it never fights with the text passing beneath it.
 */
export function ImmersiveNav() {
  const open = useMenuOpen();
  const menuButton = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuReady, setMenuReady] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    const frame = window.requestAnimationFrame(update); // pick up a restored scroll position on reload
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, []);

  // Start fetching the menu early (idle, or first interaction anywhere on the page).
  useEffect(() => whenNeeded(() => setMenuReady(true), { idleTimeout: 3000 }), []);

  const showMenu = menuReady || open;

  return (
    <>
      <header data-immersive-background className={cn("imm-nav", scrolled && "imm-nav--scrolled")}>
        <div className="imm-nav-row">
          <button
            ref={menuButton}
            type="button"
            className="imm-pill imm-nav-item"
            style={{ "--d": 0 } as React.CSSProperties}
            aria-expanded={open}
            aria-controls="immersive-menu"
            onPointerEnter={() => setMenuReady(true)}
            onFocus={() => setMenuReady(true)}
            onClick={() => setMenuOpen(true)}
          >
            <span className="imm-pill-icon" aria-hidden="true" />
            Menu
          </button>

          <Link
            href="/"
            className="imm-wordmark imm-nav-item"
            style={{ "--d": 1 } as React.CSSProperties}
            onClick={(event) => {
              // Already home: take the visitor back to the opening rather than doing nothing.
              if (window.location.pathname === "/") {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "auto" });
              }
            }}
          >
            Lustre &amp; Lace
          </Link>

          <div className="imm-nav-right imm-nav-item" style={{ "--d": 2 } as React.CSSProperties}>
            <Link href="/get-started" className="imm-pill imm-pill--solid">
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Start a project</span>
            </Link>
          </div>
        </div>
        {/* The "lace": a gold thread that draws itself across, then stays as the bar's lower edge. */}
        <span className="imm-nav-thread" aria-hidden="true" />
      </header>

      {showMenu && <MenuOverlay open={open} onClose={closeMenu} returnFocusRef={menuButton} />}
    </>
  );
}
