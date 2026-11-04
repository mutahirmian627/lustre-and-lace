import type { CSSProperties } from "react";
import Link from "next/link";
import { GemStage } from "@/features/immersive/stage/GemStage";
import { IMMERSIVE_WHATSAPP_NUMBER } from "@/features/immersive/constants";

const step = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

/**
 * First screen. Everything here is real HTML and renders on the server, so the headline, the buttons
 * and the gem's picture appear immediately; the 3D scene arrives later and sits on top.
 */
export function Hero() {
  const whatsappHref = `https://wa.me/${IMMERSIVE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi, I'd like to talk about a project with Lustre & Lace."
  )}`;

  return (
    <section className="relative min-h-svh overflow-x-clip">
      <div aria-hidden="true" className="imm-hero-light pointer-events-none absolute inset-0" />

      <header className="imm-chrome relative z-30 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/immersive" className="flex items-baseline gap-2 whitespace-nowrap leading-none">
          <span className="font-heading text-xl sm:text-2xl">Lustre &amp; Lace</span>
          <span className="hidden text-[0.62rem] font-medium uppercase tracking-[0.26em] text-[color:var(--gold-deep)] sm:inline">
            Studio
          </span>
        </Link>
        <Link href="/get-started" className="imm-cta imm-cta--ghost !min-h-10 whitespace-nowrap !px-4 sm:!px-5">
          Start a project
        </Link>
      </header>

      <div className="relative mx-auto grid max-w-[96rem] px-5 pb-16 pt-4 sm:px-8 lg:min-h-[calc(100svh-5.5rem)] lg:grid-cols-12 lg:items-center lg:px-12">
        <div className="imm-chrome relative z-10 lg:col-span-8">
          <p className="imm-eyebrow mb-5 lg:mb-7">
            <span className="sm:hidden">Web &amp; digital studio · Pakistan</span>
            <span className="hidden sm:inline">Web development &amp; digital studio · Pakistan</span>
          </p>

          <h1 className="imm-display">
            <span className="imm-line" style={step(0)}>
              Your Website
            </span>{" "}
            <span className="imm-line" style={step(1)}>
              Deserves
            </span>{" "}
            <span className="imm-line imm-better" style={step(2)}>
              Better.
              <svg className="imm-thread" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
                <path pathLength={1} d="M2 15 C 60 2, 118 25, 200 13 S 340 3, 398 14" />
              </svg>
            </span>
          </h1>

          <p className="imm-lead mt-7 max-w-xl lg:mt-9">We help businesses go digital and grow online.</p>

          <div className="mt-7 flex flex-wrap gap-3 lg:mt-8">
            <Link href="/get-started" className="imm-cta imm-cta--solid">
              Start your project
            </Link>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="imm-cta imm-cta--ghost">
              WhatsApp<span className="hidden sm:inline"> us</span>
            </a>
          </div>
        </div>

        <GemStage className="mx-auto -mt-2 w-[92vw] max-w-[34rem] lg:absolute lg:right-[1vw] lg:top-1/2 lg:mt-0 lg:w-[min(48vw,43rem)] lg:max-w-none lg:-translate-y-1/2" />
      </div>
    </section>
  );
}
