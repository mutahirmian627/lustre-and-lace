import Link from "next/link";
import { BRAND } from "@/constants/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-accent px-4 py-12">
      <Link href="/" className="mb-8 text-center">
        <span className="font-heading text-3xl text-foreground">
          {BRAND.name}
        </span>
      </Link>
      <div className="w-full max-w-md rounded-xl bg-background p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
