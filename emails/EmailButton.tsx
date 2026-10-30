import type { ReactNode } from "react";
import React from "react";
import { Section, Button } from "@react-email/components";

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={{ textAlign: "center", margin: "26px 0" }}>
      <Button
        href={href}
        style={{
          backgroundColor: "#AF5071",
          color: "#FFFFFF",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textDecoration: "none",
          textAlign: "center",
          display: "inline-block",
          padding: "14px 34px",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}
