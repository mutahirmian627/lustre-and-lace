import React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, EMAIL_COLORS } from "./EmailLayout";
import { EmailButton } from "./EmailButton";

const BODY_STYLE = { color: EMAIL_COLORS.ink, fontSize: 15, lineHeight: "24px", margin: "0 0 14px" };
const SMALL_STYLE = { color: EMAIL_COLORS.muted, fontSize: 13, lineHeight: "20px", margin: "0 0 14px" };

export default function ResetPassword({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout
      previewText="Reset your Lustre & Lace password"
      eyebrow="Account security"
      title="Reset your password"
    >
      <Text style={BODY_STYLE}>Hi {name},</Text>
      <Text style={BODY_STYLE}>
        We received a request to reset your password. Click below to choose a new one.
      </Text>
      <EmailButton href={url}>Reset my password</EmailButton>
      <Text style={SMALL_STYLE}>
        Button not working? Copy this link into your browser:
        <br />
        <a href={url} style={{ color: EMAIL_COLORS.raspberry, wordBreak: "break-all" }}>
          {url}
        </a>
      </Text>
      <Text style={SMALL_STYLE}>
        This link expires in 1 hour. If you didn&apos;t request this, you can safely ignore this
        email — your password won&apos;t be changed.
      </Text>
    </EmailLayout>
  );
}
