import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PROCESS_STEPS, SERVICES as AGENCY_SERVICES } from "@/constants/agency";
import { BRAND } from "@/constants/brand";
import { SOCIAL_LINKS } from "@/constants/site-config";
import { SERVICES } from "@/features/immersive/content";
import {
  IMMERSIVE_INSTAGRAM_HANDLE,
  IMMERSIVE_INSTAGRAM_URL,
  IMMERSIVE_WHATSAPP_DISPLAY,
  IMMERSIVE_WHATSAPP_NUMBER,
} from "@/features/immersive/constants";
import { PROCESS_STOPS, RUN, THRESHOLD_END, CONTACT_SIGMA, progressForSigma } from "@/features/immersive/lib/timeline";
import { ImmersiveNav } from "@/features/immersive/nav/ImmersiveNav";
import { StudioChat } from "@/features/studio-chat/StudioChat";
import { StageLoader } from "@/features/immersive/scene/StageLoader";
import { Backdrop } from "@/features/immersive/sections/Backdrop";
import { ScrollDriver } from "@/features/immersive/sections/ScrollDriver";
import { ServiceRail } from "@/features/immersive/sections/ServiceRail";
import { StillNote } from "@/features/immersive/sections/StillNote";
import { TierBadge } from "@/features/immersive/sections/TierBadge";
import { WORK_STOPS_DATA, type WorkStop } from "@/features/immersive/work";

export const metadata: Metadata = {
  title: { absolute: "Aperionie | Pretty Websites. Serious Business." },
  description:
    "We create distinctive digital experiences, brands, and platforms that help ambitious businesses stand out and grow.",
  alternates: { canonical: "/" },
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`;

/** One stop of the exhibition, in words. Only the one on show is visible, and so only its links can be reached. */
function WorkStopWords({ stop, index }: { stop: WorkStop; index: number }) {
  const words = stop.words;
  if (words.type === "project") {
    return (
      <article className="imm-work" data-i={index}>
        <div aria-hidden="true">
          <p className="imm-work-kind">{words.kind}</p>
          <h3 className="imm-work-name">{words.name}</h3>
          <p className="imm-work-text">{words.text}</p>
        </div>
        <div className="imm-work-links">
          {words.links.map((item) =>
            item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={item.primary ? "imm-btn" : "imm-link"}>
                {item.label}
                <span className="sr-only"> (opens in a new tab)</span>
                {!item.primary && <span aria-hidden="true">&nbsp;&rarr;</span>}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={item.primary ? "imm-btn" : "imm-link"}>
                {item.label}
                {!item.primary && <span aria-hidden="true">&nbsp;&rarr;</span>}
              </Link>
            )
          )}
        </div>
      </article>
    );
  }
  if (words.type === "list") {
    return (
      <article className="imm-work" data-i={index} aria-hidden="true">
        <p className="imm-work-kind">{words.kind}</p>
        <ul className="imm-work-list">
          {words.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {words.tags && <p className="imm-work-tags">{words.tags.join(" · ")}</p>}
      </article>
    );
  }
  return (
    <article className="imm-work" data-i={index} aria-hidden="true">
      <p className="imm-work-kind">{words.kind}</p>
      <h3 className="imm-work-name">{words.name}</h3>
      <p className="imm-work-text">{words.text}</p>
    </article>
  );
}

const step = (i: number): CSSProperties => ({ "--i": i }) as CSSProperties;

/** Where a point of the run sits, as a CSS length: `openings` screens of opening travel plus a share of the services run. */
const anchorTop = (share: number, opening = 1): string => `calc(${(RUN.opening * opening + RUN.services * share).toFixed(3)} * 100svh)`;
const WHATSAPP_HREF = `https://wa.me/${IMMERSIVE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I'd like to talk about a project with Aperionie."
)}`;

/**
 * The homepage: the opening, the approach, the services, the work, the process and the contact.
 *
 * Structure: a fixed backdrop (a picture of the scene, replaced by the live 3D canvas once it is ready), and a
 * tall "run" with a pinned stage inside it. As the page scrolls through the run, the camera travels from the
 * gallery through the doorway into the hall and on down it, one rib per service, and the text hands over from
 * scene to scene. All text is real HTML, laid out by CSS; the 3D is a picture behind it.
 */
export default function ImmersivePage() {
  // The project the screen-reader list is currently describing (set as the list is built, in order).
  let currentProject = "";

  // The same structured data the studio page carries: the site's root says who the business is and what it offers.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: BRAND.name,
    description: BRAND.descriptor,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/APERIONIE-Profile-Ink-1080.png`,
    areaServed: "PK",
    sameAs: [SOCIAL_LINKS.instagram],
    makesOffer: AGENCY_SERVICES.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service.title, description: service.short },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ScrollDriver runId="run" />
      <a href="#main" className="imm-skip">
        Skip to content
      </a>
      <Backdrop />
      <ImmersiveNav />
      <StudioChat variant="home" whatsappHref={WHATSAPP_HREF} instagramHref={IMMERSIVE_INSTAGRAM_URL} />
      {/* Everything marked data-immersive-background is made inert while the full-screen menu is open. */}
      <main id="main" data-immersive-background>
        <div id="run" className="imm-run" style={{ height: `${(1 + RUN.opening + RUN.services) * 100}svh` }}>
          {/* Where the menu's entries scroll to. */}
          <span id="approach" className="imm-anchor" style={{ top: anchorTop(0, 0.78) }} aria-hidden="true" />
          <span id="services" className="imm-anchor" style={{ top: anchorTop(0.07) }} aria-hidden="true" />
          <span id="work" className="imm-anchor" style={{ top: anchorTop(THRESHOLD_END + 0.01) }} aria-hidden="true" />
          <span id="process" className="imm-anchor" style={{ top: anchorTop(progressForSigma(PROCESS_STOPS[0] - 1)) }} aria-hidden="true" />
          <span id="contact" className="imm-anchor" style={{ top: anchorTop(progressForSigma(CONTACT_SIGMA[1] + 0.5)) }} aria-hidden="true" />
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
                <Link href="/studio/get-started" className="imm-btn">
                  Let&rsquo;s Talk
                </Link>
                <Link href="/studio" className="imm-link">
                  Who We Are? <span aria-hidden="true">&rarr;</span>
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
                the one it has just passed. The words are repeated in full in the screen-reader list below, so the
                visual words are hidden from assistive technology rather than read twice; the 01-07 index is real
                buttons, so it is not. */}
            <section className="imm-scene imm-scene--services">
              <div aria-hidden="true">
                <p className="imm-label">03 &mdash; Services</p>
                <p className="imm-statement imm-services-title">Seven disciplines, one studio.</p>
                <div className="imm-service-stack">
                  {SERVICES.map((service, i) => (
                    <article key={service.name} className="imm-service" data-i={i}>
                      <p className="imm-service-no">{String(i + 1).padStart(2, "0")}</p>
                      <h3 className="imm-service-name">{service.name}</h3>
                      <p className="imm-service-includes">{service.includes.join(" · ")}</p>
                    </article>
                  ))}
                </div>
              </div>
              <ServiceRail names={SERVICES.map((service) => service.name)} />
            </section>

            {/* The exhibition: the studio's work on the ivory hall's wall, a stop at a time, then an empty arch (see
                features/immersive/work.ts). The words are repeated in the screen-reader list below; the links are real and only
                reachable while their stop is on show. */}
            <section className="imm-scene imm-scene--work">
              <div aria-hidden="true">
                <p className="imm-label">04 &mdash; Work</p>
                <p className="imm-statement imm-work-title">Work you can open and try.</p>
              </div>
              <div className="imm-work-stack">
                {WORK_STOPS_DATA.map((stop, i) => (
                  <WorkStopWords key={i} stop={stop} index={i} />
                ))}
              </div>
            </section>

            {/* The process: five gates across the ivory hall, each a step from first chat to launch; the lattice in each gate is
                thinner than the last. The words are repeated in the screen-reader list below. */}
            <section className="imm-scene imm-scene--process" aria-hidden="true">
              <p className="imm-label">05 &mdash; Process</p>
              <p className="imm-statement imm-work-title">From first chat to first customers.</p>
              <div className="imm-work-stack">
                {PROCESS_STEPS.map((step, i) => (
                  <article key={step.title} className="imm-step" data-i={i}>
                    <p className="imm-service-no">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="imm-work-name">{step.title}</h3>
                    <p className="imm-work-text">{step.body}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* The close, in the ivory hall beyond the large doorway. Later stages place the work and the process before it. */}
            <section className="imm-scene imm-scene--contact" aria-labelledby="contact-title">
              <p className="imm-label">Contact</p>
              <h2 id="contact-title" className="imm-statement">
                Got a Business to Make Beautiful?
              </h2>
              <p className="imm-lead">Let&rsquo;s turn your next big idea into something worth remembering.</p>
              <div className="imm-actions">
                <Link href="/studio/get-started" className="imm-btn">
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
                <p>Includes: {service.includes.join(", ")}.</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="sr-only" aria-labelledby="process-title">
          <h2 id="process-title">How we work</h2>
          <p>A clear process with a quote up front, so you always know what happens next.</p>
          <ol>
            {PROCESS_STEPS.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="sr-only" aria-labelledby="work-title">
          <h2 id="work-title">Our work</h2>
          {WORK_STOPS_DATA.map((stop, i) => {
            const words = stop.words;
            if (words.type === "project") {
              currentProject = words.name;
              return (
                <div key={i}>
                  <h3>{words.name}</h3>
                  <p>
                    {words.kind}. {words.text}
                  </p>
                </div>
              );
            }
            if (words.type === "list") {
              return (
                <div key={i}>
                  <h4>
                    {currentProject}: {words.kind}
                  </h4>
                  <ul>
                    {words.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {words.tags && <p>Built with {words.tags.join(", ")}.</p>}
                </div>
              );
            }
            return (
              <p key={i}>
                {words.kind}: yours. {words.text}
              </p>
            );
          })}
        </section>
      </main>

      <StillNote />
      <TierBadge />
      <StageLoader />
    </>
  );
}
