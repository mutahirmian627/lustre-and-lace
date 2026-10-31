import { AgencyHeader } from "@/features/agency/components/AgencyHeader";
import { AgencyFooter } from "@/features/agency/components/AgencyFooter";
import { MobileCtaBar } from "@/features/agency/components/MobileCtaBar";

/** Chrome for the studio pages. No cart or wishlist here — those belong to the demo store. */
export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AgencyHeader />
      <main>{children}</main>
      {/* On phones the pinned call-to-action bar would sit over the footer's last line, so leave room for it. */}
      <div className="bg-plum max-md:pb-[4.5rem]">
        <AgencyFooter />
      </div>
      <MobileCtaBar />
    </>
  );
}
