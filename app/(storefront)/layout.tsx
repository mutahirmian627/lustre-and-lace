import { SiteShell } from "@/components/layout/SiteShell";
import { STORE_METADATA } from "@/lib/store-metadata";

export const metadata = STORE_METADATA;

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteShell>{children}</SiteShell>;
}
