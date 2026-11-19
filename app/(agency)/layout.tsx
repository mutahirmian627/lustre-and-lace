import { AgencyHeader } from "@/features/agency/components/AgencyHeader";
import { AgencyFooter } from "@/features/agency/components/AgencyFooter";
import { MobileCtaBar } from "@/features/agency/components/MobileCtaBar";
import { STUDIO_THEME_SCRIPT } from "@/features/agency/theme";
import { StudioChat } from "@/features/studio-chat/StudioChat";
import { SOCIAL_LINKS } from "@/constants/site-config";
import { getWhatsAppNumber } from "@/lib/settings";
import { buildStudioWhatsAppLink, isRealWhatsAppNumber } from "@/services/whatsapp.service";

/** Chrome for the studio pages, in the homepage's palette (see .studio-theme in globals.css). No cart or wishlist here: those belong to the demo store. */
export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  // The chat offers WhatsApp only when the studio has a real number set (the footer does the same).
  const whatsappNumber = await getWhatsAppNumber();
  const whatsappHref = isRealWhatsAppNumber(whatsappNumber) ? buildStudioWhatsAppLink(whatsappNumber) : null;

  return (
    // data-theme (light or dark) is set on this wrapper by the script just below, before the page is painted, so the server's
    // markup does not carry it: hence suppressHydrationWarning.
    <div className="studio-theme" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: STUDIO_THEME_SCRIPT }} />
      <AgencyHeader />
      <main>{children}</main>
      {/* On phones the pinned call-to-action bar would sit over the footer's last line, so leave room for it. */}
      <div className="bg-plum max-md:pb-[4.5rem]">
        <AgencyFooter />
      </div>
      <MobileCtaBar />
      <StudioChat whatsappHref={whatsappHref} instagramHref={SOCIAL_LINKS.instagram} />
    </div>
  );
}
