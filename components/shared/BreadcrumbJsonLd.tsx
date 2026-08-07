const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lustreandlace.com";

/** Structured-data mirror of a page's existing visual breadcrumb UI — not new UI (specs/15). */
export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
