import type { Metadata } from "next";
import { isAccountDeletionTokenValid } from "@/actions/account.actions";
import { ConfirmDeletionButton } from "@/features/account/components/ConfirmDeletionButton";

export const metadata: Metadata = { title: "Confirm Account Deletion" };

export default async function DeleteConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const isValid = token ? await isAccountDeletionTokenValid(token) : false;

  if (!token || !isValid) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="font-heading text-2xl text-foreground">Link expired</h1>
        <p className="text-sm text-muted-foreground">
          This deletion link is invalid or has expired. Request a new one from Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <h1 className="font-heading text-2xl text-foreground">Confirm Account Deletion</h1>
      <p className="text-sm text-muted-foreground">
        This is your last chance to back out — clicking below permanently deletes your account.
      </p>
      <ConfirmDeletionButton token={token} />
    </div>
  );
}
