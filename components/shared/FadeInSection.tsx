import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades + slides a homepage section up slightly as it enters the viewport.
 * Pure CSS (scroll-driven animation, see globals.css): no client JS, and
 * browsers without support simply show the section with no animation.
 */
export function FadeInSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("fade-in-section", className)}>{children}</div>;
}
