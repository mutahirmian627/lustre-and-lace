import { AppWindow, Bot, Globe, Megaphone, Palette, Search, ShoppingBag, type LucideIcon } from "lucide-react";
import type { ServiceSlug } from "@/constants/agency";

const ICONS: Record<ServiceSlug, LucideIcon> = {
  "website-development": Globe,
  ecommerce: ShoppingBag,
  "branding-visual-identity": Palette,
  "social-media-marketing": Megaphone,
  "seo-growth": Search,
  "custom-web-applications": AppWindow,
  "ai-business-automation": Bot,
};

export function ServiceIcon({ slug, className }: { slug: ServiceSlug; className?: string }) {
  const Icon = ICONS[slug];
  return <Icon className={className} aria-hidden="true" />;
}
