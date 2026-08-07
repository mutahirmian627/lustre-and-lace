import type { ReactNode } from "react";
// Explicit React import: this file (and Better Auth's email-sending
// background task) sometimes runs through tsx/esbuild directly (db/seed.ts)
// rather than through Next's own bundler, which defaults to the classic JSX
// transform there and needs `React` in scope.
import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { BRAND } from "@/constants/brand";

/**
 * Shared shell for every transactional email (specs/14-emails.md). Email
 * clients can't reliably load the site's actual web fonts, so headings use a
 * serif fallback stack standing in for Playfair Display's feel, and body
 * text uses a system sans stack standing in for Inter — brand colors carry
 * over directly since inline hex renders reliably everywhere fonts don't.
 */
const HEADING_FONT = "Georgia, 'Times New Roman', serif";
const BODY_FONT =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function EmailLayout({
  previewText,
  children,
}: {
  previewText: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: "#FFF8F4", fontFamily: BODY_FONT, margin: 0, padding: "32px 0" }}>
        <Container
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            maxWidth: 480,
            margin: "0 auto",
            padding: "40px 32px",
          }}
        >
          <Heading
            as="h1"
            style={{
              fontFamily: HEADING_FONT,
              color: "#2F2F2F",
              fontSize: 26,
              letterSpacing: "0.02em",
              textAlign: "center",
              margin: "0 0 4px",
            }}
          >
            {BRAND.name}
          </Heading>
          <Text
            style={{
              textAlign: "center",
              color: "#B76E79",
              fontSize: 13,
              margin: "0 0 32px",
            }}
          >
            {BRAND.tagline}
          </Text>

          {children}

          <Hr style={{ borderColor: "#ECE2DF", margin: "32px 0 16px" }} />
          <Section>
            <Text style={{ color: "#75706E", fontSize: 12, textAlign: "center", margin: 0 }}>
              {BRAND.name} — {BRAND.tagline}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
