import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPlatformSettingsForForm } from "@/actions/admin/settings.actions";
import { SettingsForm } from "@/features/admin/components/SettingsForm";
import { ProfileForm } from "@/features/account/components/ProfileForm";
import { ChangePasswordForm } from "@/features/account/components/ChangePasswordForm";

export const metadata: Metadata = { title: "Admin — Settings" };

export default async function AdminSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/shop/login");

  const platformSettingsValues = await getPlatformSettingsForForm();

  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-4 font-heading text-2xl text-foreground">Platform Settings</h2>
        <SettingsForm initialValues={platformSettingsValues} />
      </div>

      <section className="space-y-4">
        <h3 className="font-heading text-lg text-foreground">Your Profile</h3>
        <ProfileForm name={session.user.name} phone={session.user.phone ?? null} />
      </section>

      <section className="space-y-4">
        <h3 className="font-heading text-lg text-foreground">Change Password</h3>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
