import React from "react";
import { Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";
import { EmailButton } from "./EmailButton";

const BODY_STYLE = { color: "#2F2F2F", fontSize: 15, lineHeight: "24px" };

export default function ResetPassword({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout previewText="Reset your Lustre & Lace password">
      <Text style={BODY_STYLE}>Hi {name},</Text>
      <Text style={BODY_STYLE}>
        We received a request to reset your password. Click below to choose
        a new one.
      </Text>
      <EmailButton href={url}>Reset my password</EmailButton>
      <Text style={{ ...BODY_STYLE, fontSize: 13, color: "#75706E" }}>
        This link expires in 1 hour. If you didn&apos;t request this, you can
        safely ignore this email — your password won&apos;t be changed.
      </Text>
    </EmailLayout>
  );
}
