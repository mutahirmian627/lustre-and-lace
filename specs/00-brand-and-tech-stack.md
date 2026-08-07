# Lustre & Lace — Brand & Tech Stack Specification

## Brand Identity

**Name:** Lustre & Lace
**Tagline:** "Where Every Sparkle Tells Your Story."

**Personality:** Elegant, Feminine, Modern, Affordable Luxury, Minimal, Trustworthy
**Voice:** Warm, Friendly, Sophisticated, Confident
**Values:** Quality, Elegance, Affordability, Customer Happiness, Attention to Detail

**Target audience:** Women aged approximately 18–40 shopping for artificial jewellery, fashion accessories, wedding jewellery, party wear, daily wear, and gifts.

**Positioning:** Should feel like a premium jewellery boutique — comparable in polish to luxury fashion/cosmetics brands. Explicitly NOT Amazon, AliExpress, generic Shopify themes, or busy marketplaces.

## Visual Identity

### Color Palette
| Role | Color | Hex |
|---|---|---|
| Primary | Blush Pink | `#F8D7E6` |
| Secondary | Rose Gold | `#B76E79` |
| Accent | Cream | `#FFF8F4` |
| Background | White | `#FFFFFF` |
| Text | Dark Charcoal | `#2F2F2F` |
| Success | Soft Emerald | (soft/muted tone, not bright) |

Rose Gold is reserved for CTAs, active states, and price highlights — used sparingly so it stays premium rather than decorative. Avoid bright/saturated colors throughout.

### Typography
- **Headings:** Playfair Display — large tracking, generous line-height, used for H1–H3 and product names to create a "boutique" hierarchy.
- **Body/UI:** Inter — body text, prices, form fields, buttons.
- Generous whitespace and spacing throughout; elegant type hierarchy over density.

### UI Component Style
- Rounded corners, soft shadows, smooth hover transitions.
- Buttons: beautiful, subtle scale-on-hover (not bouncy).
- Minimal icon usage (Lucide React).
- Glass effects only if very subtle; gradients never overused.

### Motion (Framer Motion)
- Fade-in on section entry.
- Cards lift slightly on hover.
- Buttons scale subtly (~1.02–1.05).
- Product images zoom slightly on hover.
- Smooth page transitions.
- Restraint is the rule: motion should read as "sophisticated," never "playful" or flashy.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode, no `any`) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, Lucide React |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle ORM |
| Auth | Better Auth (session-based, not JWT) |
| Forms | React Hook Form + Zod |
| Validation | Zod on frontend, backend, and DB constraints |
| Images | Cloudinary + `next/image` |
| Emails | Resend (preferred) + React Email templates |
| Client state/fetching | React Context (cart/session-ish global UI state) + TanStack Query (only where genuine client-side re-fetching is needed, e.g. admin tables) |
| Charts (Admin Dashboard) | Recharts — chosen because shadcn/ui's own chart components are built on it, keeping the UI stack idiomatic rather than introducing a second charting approach (decided in `specs/13`) |
| Deployment | Vercel + Neon Postgres |
| Package manager | pnpm |

### Explicitly excluded
JavaScript (no `.js` files), `any` type, Prisma, Firebase, Redux, Material UI, Bootstrap, CSS Modules, Styled Components, JWT-based auth, Stripe.

## Coding Standards
- Strict TypeScript everywhere; prefer `interface` for object shapes.
- Components kept under ~250 lines where practical; small, focused functions.
- UI separated from business logic; business logic in `actions/`, `lib/`, `services/`.
- Reusable custom hooks over duplicated logic.
- SOLID principles, composition over inheritance, no deep nesting.
- Feature-based architecture (see `01-folder-structure.md`).

## Payment Model (business decision, not a placeholder)
No payment gateway integration at this stage. Checkout offers exactly two options:
1. **Cash on Delivery (COD)**
2. **Bank Transfer** to a published EasyPaisa / JazzCash number, verified manually via a WhatsApp screenshot sent by the customer, referencing a generated order reference ID. See `05-checkout-and-payments.md` for full flow.

## Non-negotiable engineering rules (apply to every milestone)
- Never generate placeholder/demo code; always production-quality.
- Never rewrite unrelated code or remove existing functionality.
- When modifying a file, output the entire file — no `...existing code...` omissions.
- Explain architecture and trade-offs before implementing.
- Validate on frontend, backend, and database — never trust client input.
- Build for SEO, accessibility, and Core Web Vitals from the start.
