/**
 * The words of the experience that are data rather than layout: the services, in the order they are met
 * down the hall. Capabilities only; no claims of results. Drafted for the owner's review before launch.
 */
export interface Service {
  name: string;
  /** One or two plain sentences on what it is and why it matters to a business. */
  summary: string;
  /** Four short things it covers, shown as a quiet mono line. */
  includes: readonly [string, string, string, string];
}

export const SERVICES: readonly Service[] = [
  {
    name: "Website Development",
    summary:
      "Fast, considered websites built around how your business actually wins customers: clear structure, clean code, and pages that load quickly on the phone in your customer's hand.",
    includes: ["Business sites", "Landing pages", "Redesigns", "Ongoing care"],
  },
  {
    name: "Ecommerce Experiences",
    summary:
      "Online stores that make buying feel easy: product pages that do justice to what you sell, a simple checkout, and an admin you can run day to day without a developer.",
    includes: ["Storefronts", "Checkout & orders", "Inventory", "Payments"],
  },
  {
    name: "Branding & Visual Identity",
    summary:
      "A name, a mark and a look that feel like you, and hold together everywhere your customers meet you, from the website to the packaging to the sign on the door.",
    includes: ["Logo & identity", "Colour & type", "Brand guidelines", "Social templates"],
  },
  {
    name: "Digital Marketing & Social Media",
    summary:
      "Consistent, on-brand content and campaigns that keep you visible where your customers already spend their time, without turning your feed into noise.",
    includes: ["Content planning", "Social management", "Paid campaigns", "Reporting"],
  },
  {
    name: "SEO & Growth",
    summary:
      "Make it easier for the right people to find you: sound technical foundations, useful pages, and steady improvement guided by what the numbers show.",
    includes: ["Technical SEO", "Local search", "Content", "Analytics"],
  },
  {
    name: "Custom Web Applications",
    summary:
      "When off-the-shelf tools don't fit, we build the software your business actually runs on: portals, dashboards, and booking or inventory systems shaped to your process.",
    includes: ["Client portals", "Dashboards", "Booking & inventory", "Integrations"],
  },
  {
    name: "AI & Business Automation",
    summary:
      "Practical automation for repetitive work: WhatsApp replies and order flows, forms that feed your spreadsheets, and assistants that answer routine questions so your team can focus on the rest.",
    includes: ["WhatsApp automation", "Workflow automation", "AI assistants", "System integrations"],
  },
] as const;
