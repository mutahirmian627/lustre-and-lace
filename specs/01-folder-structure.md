# Folder Structure Specification

## Rationale
Two decisions drive this layout:

1. **App Router route groups** — `(storefront)`, `(auth)`, `(account)`, `(admin)` each get their own `layout.tsx` (own header/nav/shell) without one giant conditional layout file. Route groups don't affect the URL — `/account/orders` stays `/account/orders`.
2. **Feature-based colocation** inside `features/` — each domain (products, cart, checkout, etc.) owns its components/hooks/types together. The codebase scales by *feature*, not by *file type*, which keeps a large, multi-milestone project navigable.

## Structure

```
lustre-and-lace/
│
├── app/
│   ├── (storefront)/                    # Public-facing — own layout (header/footer/nav)
│   │   ├── layout.tsx
│   │   ├── page.tsx                     # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx                 # Listing / category grid
│   │   │   └── [slug]/
│   │   │       ├── page.tsx             # PDP
│   │   │       └── loading.tsx
│   │   ├── categories/[slug]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── track-order/page.tsx           # Guest order lookup (reference + email), read-only — specs/11
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   └── confirmation/[orderId]/page.tsx   # EasyPaisa/JazzCash + WhatsApp instructions
│   │   └── about/ | contact/ | policies/...
│   │
│   ├── (auth)/                          # Minimal centered layout
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify-email/page.tsx
│   │
│   ├── (account)/                       # Protected — requires session
│   │   ├── layout.tsx                   # Auth guard + account sidebar
│   │   └── account/
│   │       ├── page.tsx
│   │       ├── orders/ (page.tsx, [orderId]/page.tsx)
│   │       ├── addresses/page.tsx
│   │       ├── delete-confirm/page.tsx    # Account-deletion email-link confirmation — specs/12
│   │       └── settings/page.tsx
│   │       # No nested wishlist page here — the sidebar's "Wishlist" link
│   │       # points to the single canonical /wishlist page instead
│   │       # (decided in specs/08-wishlist.md, avoids a duplicate UI).
│   │
│   ├── (admin)/                         # Protected — role guard (admin only)
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── page.tsx                 # Dashboard/analytics
│   │       ├── products/ (page.tsx, new/page.tsx, [id]/edit/page.tsx)
│   │       ├── categories/
│   │       ├── orders/page.tsx          # Includes "awaiting payment confirmation" tab
│   │       ├── customers/
│   │       ├── inventory/
│   │       ├── coupons/
│   │       ├── reviews/
│   │       ├── banners/
│   │       └── settings/
│   │
│   ├── api/
│   │   ├── auth/[...all]/route.ts       # Better Auth catch-all handler
│   │   ├── cron/
│   │   │   └── auto-cancel-unpaid-orders/route.ts   # Vercel Cron, secured — specs/11
│   │   └── webhooks/                    # Reserved, empty — no payment gateway yet
│   │
│   ├── layout.tsx                       # Root layout (fonts, providers)
│   ├── globals.css
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── sitemap.ts
│   └── robots.ts
│
├── components/
│   ├── ui/                              # shadcn/ui primitives
│   ├── layout/                          # Header, Footer, MobileNav, AdminSidebar
│   └── shared/                          # EmptyState, Skeletons, Toasts wrapper
│
├── features/
│   ├── auth/{components,hooks,types.ts}
│   ├── home/components/                 # HeroBanner, FeaturedCategories, InstagramGallery...
│   ├── products/{components,hooks,types.ts}
│   ├── categories/
│   ├── cart/{components,hooks,types.ts} # useCart (Context-based)
│   ├── checkout/{components,hooks,types.ts}
│   ├── wishlist/
│   ├── account/
│   └── admin/components/                # DataTable, StatsCard, OrderStatusBadge...
│
├── lib/
│   ├── auth.ts                          # Better Auth server config
│   ├── auth-client.ts                   # Better Auth client instance
│   ├── cloudinary.ts
│   ├── resend.ts
│   └── utils.ts                         # cn() etc.
│
├── db/
│   ├── schema/  (already generated — see specs/02-database-schema.md)
│   ├── migrations/
│   ├── seed.ts                          # Must include one admin user (see 03-authentication.md)
│   └── index.ts
│
├── actions/                             # Server Actions, grouped by feature
│   ├── auth.actions.ts
│   ├── products.actions.ts
│   ├── cart.actions.ts
│   ├── checkout.actions.ts
│   ├── wishlist.actions.ts
│   └── admin/{products,orders,...}.actions.ts
│
├── hooks/                               # Global, cross-feature hooks only
├── types/                               # Shared/global types
├── utils/
│   ├── format-currency.ts               # PKR formatting
│   └── generate-order-reference.ts      # LL-2026-00842 style IDs
├── constants/
│   ├── brand.ts                         # Name, tagline, colors, EasyPaisa/JazzCash numbers
│   ├── nav-links.ts
│   └── site-config.ts
├── services/
│   ├── cloudinary.service.ts
│   └── whatsapp.service.ts              # wa.me link builder
├── emails/                              # React Email templates
│   ├── order-confirmation.tsx
│   ├── verify-email.tsx
│   └── reset-password.tsx
├── public/
├── styles/fonts.ts                      # Playfair Display + Inter via next/font
├── specs/                                # This design documentation
├── drizzle.config.ts
├── middleware.ts                        # Route protection (account/admin guards)
├── .env.example
└── package.json
```

## Key structural decisions
- **`middleware.ts`** gates `/account/*` and `/admin/*` by session + role before any page code runs — more secure than per-page checks.
- **`services/whatsapp.service.ts`** is a small isolated helper that builds a pre-filled `wa.me` link; no WhatsApp Business API integration is needed since screenshot attachment stays manual on the customer's end.
- **`constants/brand.ts`** is the single source of truth for EasyPaisa/JazzCash numbers, brand colors, and tagline — referenced by checkout, footer, and email templates so they never drift from each other.
- This structure is designed not to change shape as milestones are added — new features slot into existing folders.
