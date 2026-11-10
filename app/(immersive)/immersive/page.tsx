import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
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

/**
 * Stage 1: the opening sequence only.
 *
 * Structure: a fixed backdrop (a picture of the scene, replaced by the live 3D canvas once it is ready), and a
 * tall "run" with a pinned stage inside it. As the page scrolls through the run, the camera travels from the
 * gallery through the doorway into the hall, and the text hands over from the opening to the next thought.
 * All text is real HTML, laid out by CSS; the 3D is a picture behind it.
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
        <div id="run" className="imm-run">
          <span id="approach" className="imm-anchor" aria-hidden="true" />
          <div className="imm-sticky">
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
      </main>

      <div className="imm-chrome pointer-events-none fixed bottom-3 right-3 z-50 rounded-full bg-black/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white">
        Experimental preview · stage 1 · opening only
      </div>
      <TierBadge />
      <StageLoader />
    </>
  );
}
