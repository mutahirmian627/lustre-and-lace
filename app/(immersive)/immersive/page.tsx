import type { Metadata } from "next";
import { ScrollAtmosphere } from "@/features/immersive/sections/ScrollAtmosphere";
import { Hero } from "@/features/immersive/sections/Hero";
import { ServicesNight } from "@/features/immersive/sections/ServicesNight";
import { ContactStub } from "@/features/immersive/sections/ContactStub";
import { TierBadge } from "@/features/immersive/sections/TierBadge";

// An experiment under review: keep it out of search results until it replaces the homepage.
export const metadata: Metadata = {
  title: { absolute: "Lustre & Lace | Your Website Deserves Better" },
  description: "We help businesses go digital and grow online.",
  robots: { index: false, follow: false },
};

export default function ImmersivePage() {
  return (
    <ScrollAtmosphere>
      <Hero />
      <ServicesNight />
      <ContactStub />
      <div className="imm-chrome pointer-events-none fixed bottom-3 right-3 z-50 rounded-full bg-black/70 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
        Experimental preview · stage 1
      </div>
      <TierBadge />
    </ScrollAtmosphere>
  );
}
