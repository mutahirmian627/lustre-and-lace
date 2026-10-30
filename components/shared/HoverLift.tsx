import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Subtle lift + shadow increase on hover, used to wrap product cards. */
export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-12px_rgb(47_47_47/0.18)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className
      )}
    >
      {children}
    </div>
  );
}
