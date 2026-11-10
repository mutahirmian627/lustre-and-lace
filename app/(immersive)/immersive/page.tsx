import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { SERVICES } from "@/features/immersive/content";
import {
  IMMERSIVE_INSTAGRAM_HANDLE,
  IMMERSIVE_INSTAGRAM_URL,
  IMMERSIVE_WHATSAPP_DISPLAY,
  IMMERSIVE_WHATSAPP_NUMBER,
} from "@/features/immersive/constants";
import { RUN, SERVICES_END } from "@/features/immersive/lib/timeline";
import { ImmersiveNav } from "@/features/immersive/nav/ImmersiveNav";
import { StageLoader } from "@/features/immersive/scene/StageLoader";
import { Backdrop } from "@/features/immersive/sections/Backdrop";
import { ScrollDriver } from "@/features/immersive/sections/ScrollDriver";
import { TierBadge } from "@/features/immersive/sections/TierBadge";

// An experiment under review: keep it out of search results until it replaces the homepage.
export const metadata: Metadata = {
  title: { absolute: "Lustre & Lace | Pretty Websites. Serious Business." },
  description:
    "We create distinctive digital experiences, brands, and platforms that help ambitious businesses stand out and grow.",
  robots: { index: false, follow: false },
};

const step = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

/** Where a point of the run sits, as a CSS length: `openings` screens of opening travel plus a share of the services run. */
const anchorTop = (share: number, opening = 1): string => `calc(${(RUN.opening * opening + RUN.services * share).toFixed(3)} * 100svh)`;
const WHATSAPP_HREF = `https://wa.me/${IMMERSIVE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I'd like to talk about a project with Lustre & Lace."
)}`;

/**
 * Stages 1-2: the opening, the approach, the services, and a provisional close.
 *
 * Structure: a fixed backdrop (a picture of the scene, replaced by the live 3D canvas once it is ready), and a
 * tall "run" with a pinned stage inside it. As the page scrolls through the run, the camera travels from the
 * gallery through the doorway into the hall and on down it, one rib per service, and the text hands over from
 * scene to scene. All text is real HTML, laid out by CSS; the 3D is a picture behind it.
 */
export default function ImmersivePage() {
  return (
    <>
      <ScrollDriver runId="run" />
      <a href="#main" className="imm-skip">
        Skip to content
      </a>
      <Backdrop />
      <ImmersiveNav />
      {/* Everything marked data-immersive-background is made inert while the full-screen menu is open. */}
      <main id="main" data-immersive-background>
        <div id="run" className="imm-run" style={{ height: `${(1 + RUN.opening + RUN.services) * 100}svh` }}>
          {/* Where the menu's entries scroll to. */}
          <span id="approach" className="imm-anchor" style={{ top: anchorTop(0, 0.78) }} aria-hidden="true" />
          <span id="services" className="imm-anchor" style={{ top: anchorTop(0.07) }} aria-hidden="true" />
          <span id="contact" className="imm-anchor" style={{ top: anchorTop(SERVICES_END + 0.08) }} aria-hidden="true" />
          <div className="imm-sticky">
            <div className="imm-scrim" aria-hidden="true" />
            <section className="imm-scene imm-scene--opening" aria-labelledby="opening-title">
              <p className="imm-label imm-fade" style={step(0)}>
                Digital studio · Pakistan
              </p>
              <h1 id="opening-title" className="imm-title">
                <span className="imm-title-serif imm-rise" style={step(0)}>
                  Pretty Websites.
                </span>
                <span className="imm-title-sans imm-rise" style={step(1)}>
                  Serious Business.
                </span>
              </h1>
              <p className="imm-lead imm-fade" style={step(1)}>
                We create distinctive digital experiences, brands, and platforms that help ambitious businesses stand
                out and grow.
              </p>
              <div className="imm-actions imm-fade" style={step(2)}>
                <Link href="/get-started" className="imm-btn">
                  Let&rsquo;s Talk
                </Link>
                <Link href="/work" className="imm-link">
                  Explore Our Work <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </section>

            <section className="imm-scene imm-scene--approach" aria-labelledby="approach-title">
              <p className="imm-label">02 &mdash; Approach</p>
              <h2 id="approach-title" className="imm-statement">
                Good ideas deserve better execution.
              </h2>
            </section>

            {/* The services: seven bays down the hall. The camera passes one rib per service, and the stage shows
                the one it has just passed. The words are repeated in full in the screen-reader list below, so this
                visual stage is hidden from assistive technology rather than read twice. */}
            <section className="imm-scene imm-scene--services" aria-hidden="true">
              <p className="imm-label">03 &mdash; Services</p>
              <p className="imm-statement imm-services-title">Seven disciplines, one studio.</p>
              <div className="imm-service-stack">
                {SERVICES.map((service, i) => (
                  <article key={service.name} className="imm-service" data-i={i}>
                    <p className="imm-service-no">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="imm-service-name">{service.name}</h3>
                    <p className="imm-service-summary">{service.summary}</p>
                    <p className="imm-service-includes">{service.includes.join(" · ")}</p>
                  </article>
                ))}
              </div>
              <ol className="imm-service-rail">
                {SERVICES.map((service, i) => (
                  <li key={service.name} data-i={i}>
                    {String(i + 1).padStart(2, "0")}
                  </li>
                ))}
              </ol>
            </section>

            {/* The close. Provisional: later stages place the work and the process before it. */}
            <section className="imm-scene imm-scene--contact" aria-labelledby="contact-title">
              <p className="imm-label">Contact</p>
              <h2 id="contact-title" className="imm-statement">
                Got a Business to Make Beautiful?
              </h2>
              <p className="imm-lead">Let&rsquo;s turn your next big idea into something worth remembering.</p>
              <div className="imm-actions">
                <Link href="/get-started" className="imm-btn">
                  Start a Conversation
                </Link>
              </div>
              <p className="imm-contact-lines">
                <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer">
                  WhatsApp <span>{IMMERSIVE_WHATSAPP_DISPLAY}</span>
                </a>
                <a href={IMMERSIVE_INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  Instagram <span>{IMMERSIVE_INSTAGRAM_HANDLE}</span>
                </a>
              </p>
            </section>

            {/* Gallery labels, pinned to points in the 3D scene by scene/Placards.tsx. */}
            <aside className="imm-placard imm-placard--left" data-placard="ribbon" aria-hidden="true">
              <p className="imm-placard-body">
                <strong>Fig. 01 &mdash; Ribbon</strong>
                Mirror chrome
              </p>
            </aside>
            <aside className="imm-placard" data-placard="portal" aria-hidden="true">
              <p className="imm-placard-body">
                <strong>Fig. 02 &mdash; Threshold</strong>
                Ivory ceramic, frosted glass
              </p>
            </aside>

            <p className="imm-cue" aria-hidden="true">
              Scroll
            </p>
          </div>
        </div>
        <section className="sr-only" aria-labelledby="services-title">
          <h2 id="services-title">Services</h2>
          <ol>
            {SERVICES.map((service) => (
              <li key={service.name}>
                <h3>{service.name}</h3>
                <p>{service.summary}</p>
                <p>Includes: {service.includes.join(", ")}.</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <div className="imm-chrome pointer-events-none fixed bottom-3 right-3 z-50 rounded-full bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">
        Experimental preview · stage 2 · opening and services
      </div>
      <TierBadge />
      <StageLoader />
    </>
  );
}
