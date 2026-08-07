"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Subtle lift + shadow increase on hover, used to wrap product cards. */
export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4, boxShadow: "0 12px 24px -12px rgb(47 47 47 / 0.18)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
