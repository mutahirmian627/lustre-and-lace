import type { ReactNode } from "react";
import React from "react";
import { Button } from "@react-email/components";

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: "#B76E79",
        color: "#FFF8F4",
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        textDecoration: "none",
        textAlign: "center",
        display: "block",
        padding: "12px 24px",
      }}
    >
      {children}
    </Button>
  );
}
