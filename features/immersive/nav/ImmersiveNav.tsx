"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MenuOverlay } from "@/features/immersive/nav/MenuOverlay";
import { setMenuOpen, useMenuOpen } from "@/features/immersive/lib/menu-store";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    const frame = window.requestAnimationFrame(update); // pick up a restored scroll position on reload
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, []);

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
            onClick={() => setMenuOpen(true)}
          >
            <span className="imm-pill-icon" aria-hidden="true" />
            Menu
          </button>

          <Link href="/immersive" className="imm-wordmark imm-nav-item" style={{ "--d": 1 } as React.CSSProperties}>
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

      <MenuOverlay open={open} onClose={closeMenu} returnFocusRef={menuButton} />
    </>
  );
}
