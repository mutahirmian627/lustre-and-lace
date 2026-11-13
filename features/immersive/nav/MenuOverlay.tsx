"use client";

import { useEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  IMMERSIVE_INSTAGRAM_HANDLE,
  IMMERSIVE_INSTAGRAM_URL,
  IMMERSIVE_MENU,
  IMMERSIVE_WHATSAPP_DISPLAY,
  IMMERSIVE_WHATSAPP_NUMBER,
} from "@/features/immersive/constants";

interface MenuOverlayProps {
  open: boolean;
  onClose: () => void;
  /** The button that opened the menu: focus goes back to it on close. */
  returnFocusRef: RefObject<HTMLElement | null>;
}

// The circle grows out of (and shrinks back into) the spot where the Menu button sits.
const ORIGIN = "4.6rem 2.3rem";
const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * The full-screen menu.
 *
 * While it is open: the page behind cannot scroll, is marked `inert` (so neither the mouse, the keyboard
 * nor a screen reader can reach it), Tab cycles inside the menu, and Escape closes it, returning focus to
 * the button that opened it.
 */
export function MenuOverlay({ open, onClose, returnFocusRef }: MenuOverlayProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const background = document.querySelectorAll<HTMLElement>("[data-immersive-background]");
    background.forEach((el) => el.setAttribute("inert", ""));

    const returnTo = returnFocusRef.current;
    panelRef.current?.querySelector<HTMLElement>("[data-menu-close]")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      html.style.overflow = previousOverflow;
      background.forEach((el) => el.removeAttribute("inert"));
      returnTo?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  /** In-page entries scroll smoothly (or jump, for reduced motion) instead of reloading the route. */
  function handleLinkClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    onClose();
    const hash = href.split("#")[1];
    if (!hash || !href.startsWith("/#")) return;
    event.preventDefault();
    window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }, 60);
  }

  const whatsappHref = `https://wa.me/${IMMERSIVE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi, I'd like to talk about a project with Lustre & Lace."
  )}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id="immersive-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="imm-menu"
          initial={reduceMotion ? { opacity: 0 } : { clipPath: `circle(0px at ${ORIGIN})` }}
          animate={reduceMotion ? { opacity: 1 } : { clipPath: `circle(150vmax at ${ORIGIN})` }}
          exit={reduceMotion ? { opacity: 0 } : { clipPath: `circle(0px at ${ORIGIN})` }}
          transition={{ duration: reduceMotion ? 0.15 : 0.75, ease: EASE }}
        >
          <div className="imm-menu-top">
            <button type="button" data-menu-close onClick={onClose} className="imm-pill">
              <span className="imm-pill-icon imm-pill-icon--close" aria-hidden="true" />
              Close
            </button>
            <span className="imm-wordmark">Lustre &amp; Lace</span>
            <span aria-hidden="true" />
          </div>

          <div className="imm-menu-body">
            <nav aria-label="Main">
              <ol className="imm-menu-list">
                {IMMERSIVE_MENU.map((item, index) => (
                  <motion.li
                    key={item.href}
                    initial={reduceMotion ? false : { y: 48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.28 + index * 0.07, ease: [0.2, 0.7, 0.2, 1] }}
                  >
                    <Link href={item.href} className="imm-menu-link" onClick={(event) => handleLinkClick(event, item.href)}>
                      <span className="imm-menu-num">{String(index + 1).padStart(2, "0")}</span>
                      <span className="imm-menu-label">{item.label}</span>
                      <span className="imm-menu-note">{item.note}</span>
                    </Link>
                  </motion.li>
                ))}
              </ol>
            </nav>

            <motion.aside
              className="imm-menu-aside"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: reduceMotion ? 0 : 0.7 }}
            >
              <p className="imm-eyebrow">Say hello</p>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="imm-menu-contact">
                WhatsApp
                <span>{IMMERSIVE_WHATSAPP_DISPLAY}</span>
              </a>
              <a href={IMMERSIVE_INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="imm-menu-contact">
                Instagram
                <span>{IMMERSIVE_INSTAGRAM_HANDLE}</span>
              </a>
              <Link href="/studio" className="imm-menu-back" onClick={onClose}>
                The studio site &rarr;
              </Link>
            </motion.aside>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
