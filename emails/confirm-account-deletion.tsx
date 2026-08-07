import React from "react";
import { Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";
import { EmailButton } from "./EmailButton";

const BODY_STYLE = { color: "#2F2F2F", fontSize: 15, lineHeight: "24px" };

export default function ConfirmAccountDeletion({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout previewText="Confirm you want to delete your Lustre & Lace account">
      <Text style={BODY_STYLE}>Hi {name},</Text>
      <Text style={BODY_STYLE}>
        We received a request to permanently delete your Lustre &amp; Lace account. This will
        remove your saved addresses, wishlist, and cart — this can&apos;t be undone.
      </Text>
      <EmailButton href={url}>Confirm Account Deletion</EmailButton>
      <Text style={{ ...BODY_STYLE, fontSize: 13, color: "#75706E" }}>
        This link expires in 1 hour. If you didn&apos;t request this, you can safely ignore this
        email — your account will stay exactly as it is.
      </Text>
    </EmailLayout>
  );
}
