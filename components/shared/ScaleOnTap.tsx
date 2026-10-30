import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Subtle scale-down on press, wraps primary buttons for tactile feedback. */
export function ScaleOnTap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-block transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        className
      )}
    >
      {children}
    </div>
  );
}
