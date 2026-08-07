import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/features/account/components/ProfileForm";
import { ChangePasswordForm } from "@/features/account/components/ChangePasswordForm";
import { DeleteAccountDialog } from "@/features/account/components/DeleteAccountDialog";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?redirect=/account/settings");
  const { user } = session;

  return (
    <div className="space-y-10">
      <h1 className="font-heading text-2xl text-foreground">Settings</h1>

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Profile</h2>
        <ProfileForm name={user.name} phone={user.phone ?? null} />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Change Password</h2>
        <ChangePasswordForm />
      </section>

      <section className="space-y-3 rounded-lg border border-destructive/30 p-5">
        <h2 className="font-heading text-lg text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Deleting your account removes your saved addresses, wishlist, and cart. This can&apos;t
          be undone.
        </p>
        <DeleteAccountDialog />
      </section>
    </div>
  );
}
