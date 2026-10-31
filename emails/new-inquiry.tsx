import React from "react";
import { Text } from "@react-email/components";
import { EmailLayout, EMAIL_COLORS } from "./EmailLayout";
import { EmailButton } from "./EmailButton";

const LABEL_STYLE = {
  color: EMAIL_COLORS.goldDark,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  margin: "14px 0 2px",
};
const VALUE_STYLE = { color: EMAIL_COLORS.ink, fontSize: 15, lineHeight: "22px", margin: 0, whiteSpace: "pre-wrap" as const };

export interface NewInquiryEmailProps {
  name: string;
  email: string;
  phone?: string | null;
  businessName: string;
  industry?: string | null;
  services: string[];
  budgetRange?: string | null;
  existingWebsite?: string | null;
  message: string;
  adminUrl: string;
}

/** Sent to the studio owner when someone fills in the project enquiry form. */
export default function NewInquiry(props: NewInquiryEmailProps) {
  const rows: [string, string | null | undefined][] = [
    ["From", `${props.name} <${props.email}>`],
    ["Phone", props.phone],
    ["Business", props.industry ? `${props.businessName} (${props.industry})` : props.businessName],
    ["Interested in", props.services.join(", ")],
    ["Budget", props.budgetRange],
    ["Current website", props.existingWebsite],
    ["Message", props.message],
  ];

  return (
    <EmailLayout
      studio
      previewText={`New project enquiry from ${props.name} (${props.businessName})`}
      eyebrow="New enquiry"
      title="Someone wants to start a project"
    >
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <React.Fragment key={label}>
            <Text style={LABEL_STYLE}>{label}</Text>
            <Text style={VALUE_STYLE}>{value}</Text>
          </React.Fragment>
        ))}
      <EmailButton href={props.adminUrl}>Open in admin</EmailButton>
      <Text style={{ color: EMAIL_COLORS.muted, fontSize: 13, margin: 0 }}>
        Reply to this email to answer {props.name} directly.
      </Text>
    </EmailLayout>
  );
}
