import { Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";
import { EmailButton } from "./EmailButton";

const BODY_STYLE = { color: "#2F2F2F", fontSize: 15, lineHeight: "24px" };

export default function VerifyEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout previewText="Verify your email to finish setting up your account">
      <Text style={BODY_STYLE}>Hi {name},</Text>
      <Text style={BODY_STYLE}>
        Welcome to Lustre &amp; Lace. Please confirm this is your email
        address so we can keep your account, orders, and wishlist safe.
      </Text>
      <EmailButton href={url}>Verify my email</EmailButton>
      <Text style={{ ...BODY_STYLE, fontSize: 13, color: "#75706E" }}>
        This link expires in 24 hours. If you didn&apos;t create an account
        with us, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
