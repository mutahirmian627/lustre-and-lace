import { Globe, Megaphone, ShoppingBag, Workflow, type LucideIcon } from "lucide-react";
import type { ServiceSlug } from "@/constants/agency";

const ICONS: Record<ServiceSlug, LucideIcon> = {
  "website-development": Globe,
  ecommerce: ShoppingBag,
  "social-media-marketing": Megaphone,
  "business-digitalization": Workflow,
};

export function ServiceIcon({ slug, className }: { slug: ServiceSlug; className?: string }) {
  const Icon = ICONS[slug];
  return <Icon className={className} aria-hidden="true" />;
}
