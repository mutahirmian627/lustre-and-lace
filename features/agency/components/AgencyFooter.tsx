import Link from "next/link";
import { Camera, MessageCircle } from "lucide-react";
import { BRAND } from "@/constants/brand";
import { SERVICES } from "@/constants/agency";
import { SOCIAL_LINKS } from "@/constants/site-config";
import { getWhatsAppNumber } from "@/lib/settings";
import { buildStudioWhatsAppLink, isRealWhatsAppNumber } from "@/services/whatsapp.service";

const LINK_CLASS = "transition-colors hover:text-secondary";

export async function AgencyFooter() {
  const whatsappNumber = await getWhatsAppNumber();
  const hasWhatsApp = isRealWhatsAppNumber(whatsappNumber);

  return (
    <footer className="bg-plum text-plum-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-sm space-y-4">
            <span className="font-heading text-3xl">{BRAND.name}</span>
            <p className="font-heading text-base italic text-secondary">{BRAND.tagline}</p>
            <p className="text-sm font-light leading-relaxed text-plum-foreground/75">
              {BRAND.descriptor}. We build websites and online stores, and help businesses reach customers on social
              media.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-plum-foreground/30 px-4 py-2 text-sm transition-colors hover:border-secondary hover:text-secondary"
              >
                <Camera className="size-4" aria-hidden="true" />
                Instagram
              </Link>
              {hasWhatsApp && (
                <a
                  href={buildStudioWhatsAppLink(whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-plum-foreground/30 px-4 py-2 text-sm transition-colors hover:border-secondary hover:text-secondary"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Services">
            <h3 className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em] text-secondary">Services</h3>
            <ul className="space-y-2.5 text-sm font-light text-plum-foreground/85">
              {SERVICES.map((service) => (
                <li key={service.slug}>
                  <Link href={`/studio/services/${service.slug}`} className={LINK_CLASS}>
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Studio">
            <h3 className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em] text-secondary">Studio</h3>
            <ul className="space-y-2.5 text-sm font-light text-plum-foreground/85">
              <li>
                <Link href="/studio/work" className={LINK_CLASS}>
                  Our work
                </Link>
              </li>
              <li>
                <Link href="/studio/about" className={LINK_CLASS}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/studio/get-started" className={LINK_CLASS}>
                  Start a project
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Demo">
            <h3 className="mb-4 font-sans text-xs font-medium uppercase tracking-[0.2em] text-secondary">See it live</h3>
            <ul className="space-y-2.5 text-sm font-light text-plum-foreground/85">
              <li>
                <Link href="/shop" className={LINK_CLASS}>
                  Demo store
                </Link>
              </li>
              <li>
                <Link href="/studio/work" className={LINK_CLASS}>
                  How it was built
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="border-t border-plum-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-plum-foreground/75 sm:px-6 md:flex-row lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <p>The demo store is a showcase project and does not sell to the public.</p>
        </div>
      </div>
    </footer>
  );
}
