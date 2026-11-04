import Link from "next/link";
import { IMMERSIVE_INSTAGRAM_URL, IMMERSIVE_WHATSAPP_NUMBER } from "@/features/immersive/constants";

/** The conversion path stays reachable from the very first preview; in stage 6 it becomes the "doorway". */
export function ContactStub() {
  const whatsappHref = `https://wa.me/${IMMERSIVE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi, I'd like to talk about a project with Lustre & Lace."
  )}`;

  return (
    <section className="relative px-5 pb-32 pt-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[96rem]">
        <p className="imm-eyebrow !text-[color:var(--gold)]">Let&apos;s talk</p>
        <p className="mt-5 max-w-3xl font-heading text-[clamp(2rem,5vw,4.2rem)] leading-[1.05] tracking-[-0.02em]">
          Tell us about your business. We&apos;ll reply with honest advice and a clear quote.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/get-started" className="imm-cta imm-cta--solid">
            Start your project
          </Link>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="imm-cta imm-cta--ghost">
            WhatsApp
          </a>
          <a href={IMMERSIVE_INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="imm-cta imm-cta--ghost">
            Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
