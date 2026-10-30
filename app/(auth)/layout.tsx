import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNewArrivals } from "@/actions/home.actions";
import { AUTH_BENEFITS, AuthShowcase } from "@/features/auth/components/AuthShowcase";
import { BRAND } from "@/constants/brand";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const products = await getNewArrivals(4);
  const images = products.flatMap((p) => (p.imageUrl ? [{ url: p.imageUrl }] : []));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthShowcase images={images} />

      <div className="flex min-w-0 flex-col bg-accent">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-10">
          <Link href="/" className="font-heading text-2xl text-foreground sm:text-3xl">
            {BRAND.name}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to shop
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-10 sm:px-8">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-sm ring-1 ring-border sm:p-8">
            {children}
          </div>

          {/* The picture panel is desktop-only, so phones get the same reasons to sign up as a compact list. */}
          <ul className="mt-8 grid w-full max-w-md gap-3 text-sm text-muted-foreground lg:hidden">
            {AUTH_BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-plum">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </main>

        <footer className="flex flex-wrap justify-center gap-x-6 gap-y-1 px-5 pb-6 text-xs text-muted-foreground">
          <Link href="/contact" className="transition-colors hover:text-primary">
            Contact
          </Link>
          <Link href="/policies/shipping" className="transition-colors hover:text-primary">
            Shipping
          </Link>
          <Link href="/policies/returns" className="transition-colors hover:text-primary">
            Returns
          </Link>
        </footer>
      </div>
    </div>
  );
}
