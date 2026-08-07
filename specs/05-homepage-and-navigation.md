# Homepage & Navigation Specification

## Navigation

### Header (persistent, all storefront pages)
- **Left:** Logo (wordmark "Lustre & Lace" in Playfair Display, or logo image if/when one exists — falls back to styled text wordmark for now).
- **Center (desktop only):** Primary nav — Necklaces, Earrings, Bracelets, Bangles, Rings, Jewellery Sets, Anklets, then a visually separated group: Wedding Collection, Party Collection, Everyday Collection. Categories with children render as a dropdown/hover-mega-menu (built on shadcn `DropdownMenu`) rather than a plain link, since `categories` supports nesting (per `specs/02`).
- **Right:** Search icon (opens a search overlay/command palette, not a full page nav-away), Wishlist icon (badge with count if `wishlists` rows exist for the logged-in user), Account icon (→ `/account` if logged in, → `/login` if not), Cart icon (badge with item count, opens `MiniCartDrawer` via `Sheet` — cart contents themselves are the Cart milestone, this spec only owns the *trigger*).
- **Mobile (<768px):** Logo centered or left, hamburger → `MobileNav` (`Sheet` from the left), search + cart icons remain visible in the top bar since they're highest-frequency actions; wishlist/account fold into the `MobileNav` drawer to avoid icon crowding on small screens.
- **Behavior:** Header is sticky on scroll but shrinks slightly (reduced vertical padding) past a scroll threshold — keeps the boutique feel without permanently eating viewport height on long product-listing scrolls.
- **Announcement bar (optional, above header):** thin bar for something like a shipping note or the tagline — dismissible, stored in a client-only state (not persisted) so it reappears next session; content sourced from `constants/site-config.ts` so it's editable without a redeploy of logic.

### Footer
- Column 1: Brand block — logo/wordmark, tagline ("Where Every Sparkle Tells Your Story."), short one-line brand description, social icons (Instagram primary, given "Instagram-worthy" brand goal).
- Column 2: Shop — links to each top-level category.
- Column 3: Help — Shipping Info, Return Policy, Track Order, Contact, FAQs.
- (No newsletter column — newsletter signup removed from scope entirely.) Three-column layout is intentional rather than stretched to four; avoids an empty-feeling fourth column now that newsletter is gone.
- Bottom bar: Copyright line, and a plain-text payment note — **"We accept Cash on Delivery and Bank Transfer (EasyPaisa / JazzCash)"** — no card network logos, since none are supported; showing card logos here would misrepresent what's actually accepted.

## Homepage sections (in order)

1. **Hero Banner**
   - Full-width, large Playfair headline + supporting Inter subtext + primary CTA button (e.g. "Shop New Arrivals").
   - **Decision: no dynamic Homepage Banners table.** Content (headline, subtext, CTA link, image) is static, sourced from `constants/site-config.ts` and swapped by editing that file directly. This is deliberately simple for launch — an admin-manageable banner system adds a schema table, an admin UI, and image-upload plumbing for a section that likely changes only occasionally (seasonally, or around a sale). Revisit only if banner content needs to change frequently enough that a code edit + redeploy becomes a real bottleneck.
   - Motion: gentle fade/slide-in on load (not scroll-triggered, since it's above the fold), image has a very subtle slow zoom (Ken Burns–style) if a background image is used — restrained, not distracting.

2. **Featured Categories**
   - Grid of category cards (image + name), sourced from `categories` where a category is flagged as featured/top-level. Links to `/categories/[slug]`.
   - Uses `HoverLift` from the shared UI layer on each card.

3. **New Arrivals**
   - Horizontally scrollable (mobile) / grid (desktop) row of `ProductCard`s. Query: `products` ordered by `createdAt desc`, `isActive = true`, limited (e.g. 8–12).
   - "View All" link → `/products?sort=newest`.

4. **Trending Products**
   - Same card pattern as New Arrivals. **Decision: admin-curated.** Query: `products` where `isTrending = true` and `isActive = true`, ordered by `displayOrder`/`updatedAt` or a simple admin-set order. The admin dashboard's Products section needs an "Trending" toggle per product (see Admin milestone). No analytics or algorithm involved — this gives direct editorial control over what customers see as trending, which matters for a boutique brand where curation is part of the value.

5. **Best Sellers**
   - **Decision: fast/cheap maintained counter**, not a live aggregate. Query: `products` ordered by `salesCount desc`, `isActive = true`, limited. `products.salesCount` (added in `specs/02`) is incremented server-side when an order's payment is confirmed (exact trigger point — `paymentStatus → "paid"` vs. delivery — to be finalized in the Orders milestone, but the column exists now regardless of that timing decision).

6. **Wedding Collection**
   - A visually distinct, larger-format section (not just another product row) — this collection is a brand priority ("Wedding Jewellery" is explicitly called out in target-audience interests). Larger imagery, a short romantic/aspirational headline, CTA → `/categories/wedding-collection`.

7. **Customer Reviews**
   - Carousel/grid of approved (`reviews.isApproved = true`) reviews with `rating >= 4` (curate for homepage positivity — full unfiltered reviews still show on PDPs). Shows reviewer first name + rating stars (`RatingStars` from shared UI) + short excerpt of `comment`.

8. **Instagram Gallery**
   - **Decision: confirmed — manually curated images**, not a live Instagram API integration. Images are uploaded via Cloudinary and referenced as a simple ordered array/config (e.g. in `constants/site-config.ts` or a lightweight admin-editable list, finalized in the Admin milestone) rather than a live feed. This avoids the Instagram Graph API's business-verification and token-refresh maintenance burden for a v1 launch. Each image can optionally link out to the actual Instagram post.

9. **Footer** (see above — no Newsletter section; removed from scope)

## Scope removed from this milestone (explicit decisions)
- **Homepage Banners table:** not built. Hero content is static/config-driven (see section 1).
- **Newsletter signup:** removed entirely — no Newsletter homepage section, and the Footer's newsletter column is removed (see updated Footer spec below). No `newsletterSubscribers` table needed.

## Data dependencies resolved by this update
- Trending Products → `products.isTrending` (admin-curated boolean, added in `specs/02`).
- Best Sellers → `products.salesCount` (maintained counter, added in `specs/02`).
- Instagram Gallery → confirmed curated Cloudinary images, no live API.

## Loading & empty-state behavior
- Each product-row section (New Arrivals, Trending, Best Sellers) renders its own `Suspense` boundary with a skeleton row, so one slow query never blocks the whole homepage from painting — matches the streaming/Suspense performance rule in `specs/00`.
- If a section genuinely has no data yet (e.g. no reviews approved yet, launch day), that section should **not render an empty shell** — it should simply not render at all, rather than showing an `EmptyState` (empty states are for user-driven pages like cart/wishlist, not for public marketing sections where "nothing here" looks broken rather than intentional).

## Accessibility & responsiveness notes specific to this milestone
- Hero CTA and all section "View All" links must be reachable via keyboard tab order in visual/logical order (a common bug with horizontally-scrolling mobile rows is a broken tab order — verify explicitly).
- Horizontally scrollable product rows on mobile need visible scroll affordance (partial next-card peeking, not a hard cutoff) so it reads as "scrollable" without needing an explicit label.

## Files this milestone touches (for Claude Code's reference)
- `app/(storefront)/page.tsx` (composes all sections)
- `app/(storefront)/layout.tsx` (Header + Footer shell)
- `components/layout/{Header,Footer,MobileNav}.tsx` (implemented fully here, though scoped/stubbed in `specs/04`)
- `features/home/components/`: `HeroBanner`, `FeaturedCategories`, `ProductRow` (shared by New Arrivals/Trending/Best Sellers), `WeddingCollectionBanner`, `ReviewsCarousel`, `InstagramGallery`
- `constants/site-config.ts` (hero banner content, announcement bar copy, curated Instagram image list, nav structure fallback)
- `actions/home.actions.ts` or feature-scoped equivalents for homepage data fetches (New Arrivals, Trending, Best Sellers, Reviews)
