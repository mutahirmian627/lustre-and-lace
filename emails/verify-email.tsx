import React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, EMAIL_COLORS } from "./EmailLayout";
import { EmailButton } from "./EmailButton";

const BODY_STYLE = { color: EMAIL_COLORS.ink, fontSize: 15, lineHeight: "24px", margin: "0 0 14px" };
const SMALL_STYLE = { color: EMAIL_COLORS.muted, fontSize: 13, lineHeight: "20px", margin: "0 0 14px" };

export default function VerifyEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout
      previewText="One quick step to finish setting up your account"
      eyebrow="Welcome"
      title="Confirm your email"
    >
      <Text style={BODY_STYLE}>Hi {name},</Text>
      <Text style={BODY_STYLE}>
        Welcome to Lustre &amp; Lace! Please confirm this is your email address so we can keep your
        account, orders and wishlist safe. Once confirmed, you can sign in and start shopping.
      </Text>
      <EmailButton href={url}>Verify my email</EmailButton>
      <Text style={SMALL_STYLE}>
        Button not working? Copy this link into your browser:
        <br />
        <a href={url} style={{ color: EMAIL_COLORS.raspberry, wordBreak: "break-all" }}>
          {url}
        </a>
      </Text>
      <Text style={SMALL_STYLE}>
        This link expires in 24 hours. If you didn&apos;t create an account with us, you can safely
        ignore this email.
      </Text>
    </EmailLayout>
  );
}
