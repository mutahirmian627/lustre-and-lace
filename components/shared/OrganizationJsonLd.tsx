import { BRAND } from "@/constants/brand";
import { SOCIAL_LINKS } from "@/constants/site-config";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`;

/** Homepage-only — helps search engines associate the brand entity correctly (specs/15). */
export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    sameAs: [SOCIAL_LINKS.instagram],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
