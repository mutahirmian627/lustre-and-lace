/**
 * The words of the experience that are data rather than layout: the services, in the order they are met
 * down the hall, each with its four points. Capabilities only; no claims of results.
 */
export interface Service {
  name: string;
  /** Four short things it covers, shown as a quiet mono line. */
  includes: readonly [string, string, string, string];
}

export const SERVICES: readonly Service[] = [
  {
    name: "Website Development",
    includes: ["Business sites", "Landing pages", "Redesigns", "Ongoing care"],
  },
  {
    name: "Ecommerce Experiences",
    includes: ["Storefronts", "Checkout & orders", "Inventory", "Payments"],
  },
  {
    name: "Branding & Visual Identity",
    includes: ["Logo & identity", "Colour & type", "Brand guidelines", "Social templates"],
  },
  {
    name: "Digital Marketing & Social Media",
    includes: ["Content planning", "Social management", "Paid campaigns", "Reporting"],
  },
  {
    name: "SEO & Growth",
    includes: ["Technical SEO", "Local search", "Content", "Analytics"],
  },
  {
    name: "Custom Web Applications",
    includes: ["Client portals", "Dashboards", "Booking & inventory", "Integrations"],
  },
  {
    name: "AI & Business Automation",
    includes: ["WhatsApp automation", "Workflow automation", "AI assistants", "System integrations"],
  },
] as const;
