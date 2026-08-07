"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Subtle scale-down on press, wraps primary buttons for tactile feedback. */
export function ScaleOnTap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      style={{ display: "inline-block" }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
