# Products & Categories Specification

## Category depth decision (affects every query in this milestone)

`categories` is self-referencing (per `specs/02`), but the actual content is only ever **two levels deep** in practice: top-level categories (Necklaces, Earrings, Rings...) and collection-style groupings (Wedding, Party, Everyday). **Decision: cap queries at two levels, no recursive CTE.** A category page fetches products where `categoryId` matches the selected category **or** any of its direct children's IDs (one extra `IN` clause, fetched once). This keeps every listing query simple and fast. If a third nesting level is ever introduced, this decision needs revisiting — flagged here so it isn't silently wrong later.

## Controlled variant attributes (affects filtering)

`productVariants.attributes` is a flexible `jsonb` bag (per `specs/02`), which is right for storage, but **filtering needs consistent, known keys/values** — free-form jsonb would make filter UI generation unreliable. **Decision:** a fixed, small set of controlled attribute keys lives in `constants/product-attributes.ts`:

```
plating: ["Gold Plated", "Silver Plated", "Rose Gold Plated", "Antique Gold"]
color:   ["Clear/White", "Pink", "Green", "Red", "Multicolor"]
size:    ["Adjustable", "Small", "Medium", "Large"]
```

Admins pick from these controlled lists when creating a variant (Admin milestone), rather than typing free text — this is what makes deterministic filter checkboxes possible on listing pages (`WHERE attributes->>'plating' = 'Gold Plated'`). New values require a code change to this constants file, which is intentional — it's a small, deliberate list, not user-generated taxonomy.

## Category Pages (`/categories/[slug]`)

- Header: category name (Playfair), optional description, breadcrumb (`Home / Wedding Collection`).
- Product grid: `ProductCard` + `HoverLift`, matching the shared UI layer.
- **Filters** (sidebar on desktop, `Sheet`-based drawer on mobile — reusing the shared UI `Sheet` primitive):
  - Price range (slider, bounds derived from min/max `basePrice` in the current result set).
  - Plating / Color / Size — checkboxes, generated from the controlled attribute lists above, only showing options that actually exist among in-scope products (no dead checkboxes).
  - Rating (4★ & up, 3★ & up, etc.) using `products.ratingAverage`.
  - "In stock only" toggle — filters out variants/products with `stockQuantity = 0`.
- **Sorting:** Newest, Price (Low→High), Price (High→Low), Best Selling (`salesCount desc`), Top Rated (`ratingAverage desc`).
- **Pagination:** page size 12, using the shared `Pagination` primitive.
- Filters and sort are reflected in the URL as query params (`?plating=Gold+Plated&sort=price_asc&page=2`) so results are shareable/bookmarkable and back-button-safe — not held only in client state.

## Product Listing Page (`/products`)

Same filter/sort/pagination behavior as category pages, minus the single-category scope — this is the destination for "View All" links from homepage rows (New Arrivals, Trending, Best Sellers) with the relevant sort pre-applied via query param (e.g. `/products?sort=newest`).

## Product Detail Page (`/products/[slug]`)

### Layout
- Two-column on desktop (gallery left, info right), stacked on mobile with gallery first.
- Breadcrumb: `Home / [Category] / [Product Name]`.

### Image Gallery
- Main image + thumbnail strip; click/hover zoom (a lightweight zoom-on-hover, not a heavy lightbox library, to keep bundle size down).
- Images shown are **variant-aware**: if the selected variant has its own `productImages` rows, show those; otherwise fall back to the product-level images. Switching variants swaps the gallery, not just a color swatch.

### Variant Selection
- Rendered from the controlled attribute keys present on this product's variants (e.g. a row of plating swatches, a size dropdown if sizes exist).
- Selecting a combination resolves to a specific `productVariants` row; if that exact combination doesn't exist as a variant, disable the incompatible option rather than allowing an invalid selection.
- Selected variant is reflected in the URL (`?variant=<id>`) so a shared link lands on the correct variant, and browser back/forward moves between variant selections correctly.
- Price, stock badge, and gallery all update reactively on selection — no page reload.

### Stock & Pricing Display
- `PriceDisplay` (from shared UI) shows the selected variant's `price`, with `compareAtPrice` struck through when present.
- Stock badge: "In Stock" (plain), **"Low Stock"** (no exact number shown) when `stockQuantity <= 5`, "Out of Stock" when `stockQuantity = 0`. The exact remaining count is intentionally not displayed to the customer — it's useful internally (admin dashboard) but showing a precise number publicly isn't necessary and can look slightly less premium/boutique than a simple status label.
- Out-of-stock variants: "Add to Cart" is disabled and replaced with a disabled state + label; Wishlist toggle remains available regardless of stock.

### Quantity & Add to Cart
- Quantity stepper capped at the selected variant's `stockQuantity`.
- "Add to Cart" is sticky on mobile once the user scrolls past the initial price/CTA block (shows a condensed price + button bar), so the primary action stays reachable during a long PDP scroll — matches the "Sticky Add To Cart" requirement.

### Below the fold
- Tabs or Accordion (shared UI `accordion`): **Description**, **Shipping Info**, **Return Policy**, **Reviews**.
- **Reviews tab:** rating breakdown (count per star), list of approved (`isApproved = true`) reviews newest-first, "Write a Review" CTA.
  - Per the resolved auth-milestone decision: writing a review requires a **verified email** (logged in + `emailVerified = true`). Unverified/guest users can read reviews but see a prompt to verify/sign in instead of the review form.
- **Related Products:** same category, excluding the current product, limited (e.g. 8), using the same `ProductRow`-style component pattern established in the Homepage milestone rather than a new one-off component.
- **Recently Viewed:** client-side tracked (browser storage, not a database table — this is the actual production app, not a chat artifact, so standard browser storage is appropriate here) — stores the last ~12 viewed product slugs, rendered as a row excluding the current product. No login required for this to work; a server-side synced version for logged-in users can be a fast-follow, not required for launch.

## SEO (per-product and per-category)

- `generateMetadata` per PDP: title (`{Product Name} | Lustre & Lace`), description from `products.description` (truncated), Open Graph image from the primary `productImages` row.
- JSON-LD structured data (`schema.org/Product`) on every PDP: name, image, description, offers (price, currency PKR, availability based on stock), and `aggregateRating` (from `ratingAverage`/`ratingCount`) when review count > 0.
- Category pages get their own `generateMetadata` (title/description per category) and a `schema.org/CollectionPage` or `BreadcrumbList` structured data block.
- Canonical URLs set explicitly on both PDP and category pages to avoid duplicate-content issues from filter/sort query params.

## Loading & empty states
- PDP: `loading.tsx` skeleton matches the real two-column layout (gallery skeleton + info skeleton) to avoid layout shift.
- Category/listing pages: skeleton grid while loading; genuine "no products match these filters" state uses the shared `EmptyState` component with a "Clear filters" action — this is a real user-driven empty state (unlike the homepage sections, which hide entirely when empty).

## Files this milestone touches (for Claude Code's reference)
- `app/(storefront)/products/page.tsx`, `app/(storefront)/products/[slug]/page.tsx`, `app/(storefront)/products/[slug]/loading.tsx`
- `app/(storefront)/categories/[slug]/page.tsx`
- `features/products/components/`: `ProductCard`, `ProductGrid`, `Gallery`, `VariantSelector`, `StockBadge`, `FiltersSidebar`, `SortDropdown`, `RelatedProducts`, `RecentlyViewed`, `ReviewsTab`, `ReviewForm`, `RatingBreakdown`
- `features/products/hooks/`: `useRecentlyViewed`, `useVariantSelection`
- `features/products/types.ts`
- `constants/product-attributes.ts` (controlled plating/color/size lists)
- `actions/products.actions.ts`: `getProducts` (filters/sort/pagination), `getProductBySlug` (with variants + images + approved reviews), `submitReview` (verified-email gated)
