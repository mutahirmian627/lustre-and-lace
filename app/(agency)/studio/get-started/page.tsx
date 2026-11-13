import type { Metadata } from "next";
import { Check, MessageCircle } from "lucide-react";
import { SERVICES, getService } from "@/constants/agency";
import { EnquiryForm } from "@/features/agency/components/EnquiryForm";
import { getWhatsAppNumber } from "@/lib/settings";
import { buildStudioWhatsAppLink, isRealWhatsAppNumber } from "@/services/whatsapp.service";

export const metadata: Metadata = {
  title: "Start a Project",
  description: "Tell us about your business and what you want to achieve online. You'll get a clear quote with no commitment.",
  alternates: { canonical: "/studio/get-started" },
};

export default async function GetStartedPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const defaultService = service ? getService(service)?.slug : undefined;
  const whatsappNumber = await getWhatsAppNumber();

  return (
    <div>
      <section className="bg-accent">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-9 text-center sm:space-y-4 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold-dark">Start a project</p>
          <h1 className="font-heading text-[2rem] leading-tight text-foreground sm:text-5xl">
            Tell us about your business
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            A few details are enough to get started. We&apos;ll reply with honest advice and a clear quote.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[1.6fr_1fr] lg:px-8">
        <EnquiryForm defaultService={defaultService} />

        <aside className="space-y-6 lg:pt-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-lg text-foreground">What happens next</h2>
            <ol className="mt-4 space-y-4 text-sm text-foreground/85">
              {[
                "We read your details and may ask a few follow-up questions.",
                "You get a clear written quote and a rough timeline.",
                "If it feels right, we start. If not, no hard feelings.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-plum">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {isRealWhatsAppNumber(whatsappNumber) && (
            <a
              href={buildStudioWhatsAppLink(whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-sm transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                <MessageCircle className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-medium text-foreground">Prefer WhatsApp?</span>
                <span className="text-muted-foreground">Message us directly and we&apos;ll chat there.</span>
              </span>
            </a>
          )}

          <div className="rounded-2xl border border-border bg-accent p-6 text-sm">
            <h2 className="font-heading text-lg text-foreground">We can help with</h2>
            <ul className="mt-3 space-y-2 text-foreground/85">
              {SERVICES.map((item) => (
                <li key={item.slug} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item.title}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
