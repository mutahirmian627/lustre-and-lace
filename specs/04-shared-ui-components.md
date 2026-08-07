# Shared UI Components & Design System Specification

## shadcn/ui integration (confirms existing tech-stack decision)

shadcn/ui was already part of the tech stack from the project's start (`specs/00-brand-and-tech-stack.md`). This milestone is where that decision becomes concrete:

- shadcn/ui is **not a component library dependency** — it's a CLI that copies component source into `components/ui/` (matches the folder structure already defined). This means every primitive is fully owned, readable, and editable code, not a black-box import — which fits the "never use placeholders / production-quality" rule better than a traditional UI kit would.
- Because it's copied source, **Tailwind v4 + shadcn's CSS-variable theming is the mechanism for applying the Lustre & Lace brand**, not a config object. The brand palette (`specs/00`) is defined once as CSS variables and every shadcn primitive inherits it automatically.
- `components.json` (shadcn's config file) settings for this project:
  - `style`: `"new-york"` (tighter, more minimal spacing/radius — matches "minimal, sophisticated" brand goal better than the default `"default"` style, which reads more generic/rounded).
  - `baseColor`: a neutral (`"neutral"` or `"stone"`) as the shadcn scaffold default, immediately overridden by our own CSS variables below — shadcn's base color choice barely matters since we replace the palette.
  - `cssVariables`: `true` — required for our brand theming approach to work.
  - `rsc`: `true` (App Router / Server Components).
  - `iconLibrary`: `"lucide"` — matches existing stack decision, no separate icon set introduced.

## Design tokens (CSS variables, defined once in `app/globals.css`)

These map the approved brand palette (`specs/00`) into the semantic variable names shadcn's components expect, so every primitive (Button, Card, Dialog, Input, etc.) picks up the brand automatically without per-component overrides:

| Semantic token | Brand color | Usage |
|---|---|---|
| `--background` | White `#FFFFFF` | Page background |
| `--foreground` | Dark Charcoal `#2F2F2F` | Body text |
| `--primary` | Rose Gold `#B76E79` | Primary buttons, active nav states, price highlights |
| `--primary-foreground` | White | Text on primary-colored surfaces |
| `--secondary` | Blush Pink `#F8D7E6` | Secondary buttons, subtle highlighted sections, badges |
| `--accent` | Cream `#FFF8F4` | Section backgrounds, hover surfaces, card backgrounds |
| `--muted` | Cream (lower opacity) or light grey-pink blend | Disabled states, skeleton backgrounds |
| `--success` | Soft Emerald (muted, not bright) | Success toasts, "In Stock" badges |
| `--destructive` | Muted rose/red (not alarming-bright) | Error states, delete confirmations — should still feel "boutique," not harsh |
| `--border` / `--input` | Charcoal at low opacity | Subtle borders — brand goal is minimal visible chrome |
| `--radius` | ~`0.75rem` base | Rounded corners per brand style; scaled per component (buttons more rounded, cards less) |

Two font variables are also defined and wired to `next/font` (in `styles/fonts.ts`, already in the folder structure):
- `--font-heading`: Playfair Display
- `--font-body`: Inter

## Component inventory for this milestone

### From shadcn/ui (installed via CLI into `components/ui/`, then re-themed via the tokens above — no per-component logic changes needed)
`button`, `input`, `label`, `textarea`, `select`, `checkbox`, `radio-group`, `form` (RHF + Zod integration wrapper), `card`, `dialog`, `sheet` (used for the Mini Cart Drawer and mobile nav), `dropdown-menu`, `sonner` (toast notifications — shadcn's current recommended toast approach), `skeleton`, `badge`, `separator`, `avatar`, `tabs`, `accordion` (for PDP shipping/returns info, FAQ-style sections), `pagination`, `breadcrumb`.

### Custom, brand-specific (built in `components/layout/` and `components/shared/`, on top of the primitives above)
| Component | Responsibility |
|---|---|
| `Header` | Logo, primary nav, search trigger, wishlist icon, mini-cart trigger, mobile hamburger → `Sheet` |
| `MobileNav` | Slide-out nav using `Sheet`, thumb-friendly tap targets per accessibility rules |
| `Footer` | Brand tagline, nav links, newsletter signup slot, social links, payment-method notice (COD/EasyPaisa/JazzCash — no card logos, since none are supported) |
| `EmptyState` | Reusable "nothing here yet" pattern (empty cart, empty wishlist, no search results, no orders) — icon + heading (Playfair) + supporting text (Inter) + optional CTA button |
| `LoadingSkeleton` variants | Product card skeleton, PDP skeleton, order-row skeleton — built on shadcn's `Skeleton` primitive, sized to match the real components they stand in for (prevents layout shift) |
| `SectionHeading` | Reusable Playfair Display heading + optional Rose Gold underline accent, used across homepage sections (New Arrivals, Best Sellers, etc.) |
| `PriceDisplay` | Formats PKR pricing consistently (uses `utils/format-currency.ts`), shows strikethrough `compareAtPrice` next to current price when present |
| `RatingStars` | Read-only star display driven by `ratingAverage`/`ratingCount` from the products schema |

### Motion wrapper components (Framer Motion, kept thin and reusable rather than inlined everywhere)
| Component | Behavior |
|---|---|
| `FadeInSection` | Wraps homepage sections; fades + slight upward translate on scroll into view |
| `HoverLift` | Wraps product cards; subtle lift + shadow increase on hover |
| `ScaleOnTap` | Wraps primary buttons; subtle scale-down on press for tactile feedback |

These three cover every animation pattern specified in `specs/00` (fade-in, card lift, button scale, image zoom is handled directly on the image element's hover class rather than a wrapper, since it's a single CSS transform).

## Accessibility requirements for this milestone specifically
- All interactive shadcn primitives (`Dialog`, `Sheet`, `DropdownMenu`) come with focus-trap and keyboard nav out of the box — do not override or suppress this behavior when customizing styles.
- Every icon-only control (wishlist heart, cart icon, mobile hamburger) needs an explicit `aria-label` — Lucide icons carry no accessible name by themselves.
- Focus-visible states must remain clearly visible against the Cream/Blush palette — verify contrast specifically, since light-on-light brand colors are the most likely place accessibility contrast quietly breaks.
- `EmptyState` and `LoadingSkeleton` regions should use `aria-live="polite"` where content swaps in dynamically (e.g. search results, filtered product grids), so screen reader users get notified of the update.

## What's intentionally deferred to later milestones
- Product-specific components (`ProductCard`, `Gallery`, `VariantSelector`) — belong to the Products milestone, not shared UI, even though they'll consume `PriceDisplay`/`RatingStars`/`HoverLift` from here.
- `MiniCartDrawer` contents (line items, totals) — belongs to the Cart milestone; only the `Sheet` primitive it's built on is scoped here.
- Admin-specific `DataTable`/`StatsCard` — belong to the Admin milestone; they'll reuse `Badge`, `Skeleton`, and `Card` from this shared layer but aren't defined here.

## Files this milestone touches (for Claude Code's reference)
- `components.json`
- `app/globals.css` (CSS variable definitions)
- `styles/fonts.ts`
- `components/ui/*` (shadcn-generated)
- `components/layout/{Header,Footer,MobileNav}.tsx`
- `components/shared/{EmptyState,SectionHeading,PriceDisplay,RatingStars,FadeInSection,HoverLift,ScaleOnTap}.tsx` and skeleton variants
- `utils/format-currency.ts` (referenced by `PriceDisplay`, not redefined here — already scoped in `specs/01`)
