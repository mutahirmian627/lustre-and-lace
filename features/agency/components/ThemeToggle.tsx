"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { STUDIO_THEME_KEY, type StudioTheme } from "@/features/agency/theme";

/**
 * Night mode for the studio pages: a sun/moon button. The theme lives on the `.studio-theme` wrapper as data-theme (set before
 * first paint by ThemeScript, from the visitor's saved choice or else their system setting); this reads it and flips it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<StudioTheme | null>(null);

  useEffect(() => {
    const wrapper = document.querySelector<HTMLElement>(".studio-theme");
    setTheme(wrapper?.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: StudioTheme = theme === "dark" ? "light" : "dark";
    document.querySelector<HTMLElement>(".studio-theme")?.setAttribute("data-theme", next);
    setTheme(next);
    try {
      window.localStorage.setItem(STUDIO_THEME_KEY, next);
    } catch {
      // Private windows and blocked storage: the choice still applies until the page is closed.
    }
  }

  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      // Until the theme is read (first client render) the label is the neutral one, so server and client agree.
      aria-label={theme === null ? "Switch colour theme" : dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Night mode"}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className
      )}
    >
      {dark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
    </button>
  );
}
