import type { ReactNode } from "react";
// Explicit React import: this file (and Better Auth's email-sending
// background task) sometimes runs through tsx/esbuild directly (db/seed.ts)
// rather than through Next's own bundler, which defaults to the classic JSX
// transform there and needs `React` in scope.
import React from "react";
import { Body, Container, Head, Html, Link, Preview, Section, Text } from "@react-email/components";
import { BRAND } from "@/constants/brand";

/**
 * Shared shell for every transactional email (specs/14-emails.md), dressed like
 * the storefront: plum header with the wordmark, blush title band, raspberry
 * button, champagne-gold ornaments, plum footer. Email clients can't load the
 * site's web fonts, so headings use a Georgia serif standing in for Playfair
 * Display and body text a system sans standing in for Public Sans. Colours are
 * inline hex and the ornaments are text glyphs, so nothing depends on images
 * loading; the optional header pattern only appears on a public (non-localhost) site.
 */
const HEADING_FONT = "Georgia, 'Times New Roman', serif";
const BODY_FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const EMAIL_COLORS = {
  plum: "#4E3844",
  plumSoft: "#6A5160",
  raspberry: "#AF5071",
  blush: "#F4C6CF",
  blushLight: "#F9E2E7",
  blushWhite: "#FFF7F7",
  champagne: "#EDE4D3",
  gold: "#B58B45",
  goldLight: "#D4B073",
  goldDark: "#8A6A2E",
  ink: "#221D1D",
  muted: "#605858",
  border: "#EFECEA",
} as const;

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`).replace(/\/$/, "");
}

/** Images only work in a real inbox when the site is public, so skip them for a localhost URL. */
function canUseHostedImages(siteUrl: string) {
  return !/localhost|127\.0\.0\.1|\[::1\]/.test(siteUrl);
}

export function EmailLayout({
  previewText,
  eyebrow,
  title,
  children,
}: {
  previewText: string;
  /** Small gold label above the title, e.g. "Welcome". */
  eyebrow?: string;
  /** Large title in the blush band under the header. */
  title?: string;
  children: ReactNode;
}) {
  const siteUrl = getSiteUrl();
  const headerImage = canUseHostedImages(siteUrl) ? `${siteUrl}/email/header.png` : undefined;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body
        style={{
          backgroundColor: EMAIL_COLORS.blushWhite,
          fontFamily: BODY_FONT,
          margin: 0,
          padding: "28px 12px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            maxWidth: 560,
            margin: "0 auto",
            overflow: "hidden",
            border: `1px solid ${EMAIL_COLORS.border}`,
          }}
        >
          {/* Header */}
          <Section
            // `background` is the pattern image; bgcolor is the fallback when images are blocked.
            {...(headerImage ? { background: headerImage } : {})}
            style={{
              backgroundColor: EMAIL_COLORS.plum,
              ...(headerImage
                ? { backgroundImage: `url(${headerImage})`, backgroundSize: "cover", backgroundPosition: "center" }
                : {}),
              padding: "36px 24px 30px",
              textAlign: "center",
            }}
          >
            <Text
              aria-hidden="true"
              style={{ margin: "0 0 10px", color: EMAIL_COLORS.goldLight, fontSize: 14, letterSpacing: "0.5em" }}
            >
              ✦ ✦ ✦
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: HEADING_FONT,
                color: EMAIL_COLORS.blushWhite,
                fontSize: 34,
                lineHeight: "40px",
                letterSpacing: "0.02em",
              }}
            >
              {BRAND.name}
            </Text>
            <Text
              style={{
                margin: "8px 0 0",
                color: EMAIL_COLORS.champagne,
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              Artificial jewellery boutique
            </Text>
            <Section style={{ width: 56, margin: "18px auto 0", borderTop: `2px solid ${EMAIL_COLORS.gold}` }} />
          </Section>

          {/* Title band */}
          {title && (
            <Section
              style={{
                backgroundColor: EMAIL_COLORS.blushLight,
                padding: "26px 32px",
                textAlign: "center",
              }}
            >
              {eyebrow && (
                <Text
                  style={{
                    margin: "0 0 6px",
                    color: EMAIL_COLORS.goldDark,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                >
                  {eyebrow}
                </Text>
              )}
              <Text
                style={{
                  margin: 0,
                  fontFamily: HEADING_FONT,
                  color: EMAIL_COLORS.ink,
                  fontSize: 26,
                  lineHeight: "34px",
                }}
              >
                {title}
              </Text>
            </Section>
          )}

          {/* Body */}
          <Section style={{ padding: "30px 36px 12px" }}>{children}</Section>

          {/* Ornament divider */}
          <Section style={{ padding: "8px 36px 26px", textAlign: "center" }}>
            <Text style={{ margin: 0, color: EMAIL_COLORS.gold, fontSize: 14, letterSpacing: "0.6em" }}>✦</Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: EMAIL_COLORS.plum, padding: "26px 24px", textAlign: "center" }}>
            <Text style={{ margin: "0 0 12px", fontSize: 13, color: EMAIL_COLORS.champagne }}>
              <FooterLink href={`${siteUrl}/products`}>Shop</FooterLink>
              <Dot />
              <FooterLink href={`${siteUrl}/sale`}>Sale</FooterLink>
              <Dot />
              <FooterLink href={`${siteUrl}/track-order`}>Track order</FooterLink>
              <Dot />
              <FooterLink href={`${siteUrl}/contact`}>Contact</FooterLink>
            </Text>
            <Text style={{ margin: 0, color: "#CDBFC6", fontSize: 12, lineHeight: "18px" }}>
              {BRAND.tagline}
            </Text>
            <Text style={{ margin: "10px 0 0", color: "#CDBFC6", fontSize: 11 }}>
              © {new Date().getFullYear()} {BRAND.name}. You&apos;re receiving this because of activity on your account.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={{ color: EMAIL_COLORS.champagne, textDecoration: "underline" }}>
      {children}
    </Link>
  );
}

function Dot() {
  return <span style={{ color: EMAIL_COLORS.goldLight }}> &nbsp;✦&nbsp; </span>;
}
