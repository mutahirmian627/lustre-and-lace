import React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, EMAIL_COLORS } from "./EmailLayout";
import { EmailButton } from "./EmailButton";

const BODY_STYLE = { color: EMAIL_COLORS.ink, fontSize: 15, lineHeight: "24px", margin: "0 0 14px" };
const SMALL_STYLE = { color: EMAIL_COLORS.muted, fontSize: 13, lineHeight: "20px", margin: "0 0 14px" };

/** Sent to the person who submitted the enquiry, so they know it arrived. */
export default function InquiryReceived({
  name,
  businessName,
  siteUrl,
}: {
  name: string;
  businessName: string;
  siteUrl: string;
}) {
  return (
    <EmailLayout
      studio
      previewText="Thanks for getting in touch. We've received your project details."
      eyebrow="Enquiry received"
      title="Thanks, we've got your details"
    >
      <Text style={BODY_STYLE}>Hi {name},</Text>
      <Text style={BODY_STYLE}>
        Thank you for telling us about {businessName}. We&apos;ve received your project details and will read them
        carefully, then get back to you by email or WhatsApp with some questions and a clear quote.
      </Text>
      <Text style={BODY_STYLE}>
        While you wait, you can see the kind of work we do by trying our demo store.
      </Text>
      <EmailButton href={`${siteUrl}/shop`}>Open the demo store</EmailButton>
      <Text style={SMALL_STYLE}>
        No commitment is needed at any point. If you didn&apos;t send this enquiry, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}
