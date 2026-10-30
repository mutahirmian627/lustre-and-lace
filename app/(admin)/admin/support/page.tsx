import type { Metadata } from "next";
import { SupportSubnav } from "@/features/admin/components/SupportSubnav";
import { SupportInbox } from "@/features/admin/components/SupportInbox";

export const metadata: Metadata = { title: "Admin — Support" };

export default function AdminSupportPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-foreground">Support</h2>
      <SupportSubnav active="/admin/support" />
      <SupportInbox />
    </div>
  );
}
