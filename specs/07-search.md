# Search Specification

## Search backend approach

**Decision: PostgreSQL full-text search (`tsvector`/`ts_rank`), not a third-party search service.** At this scale (a curated jewellery catalog, not millions of SKUs), a dedicated search service (Algolia, Meilisearch, Typesense) would be meaningful added infrastructure and cost for no real benefit — Postgres's built-in full-text search is more than capable and keeps the stack simple, matching the project's "avoid overengineering" rule.

- A `searchVector` column (type `tsvector`) is added to `products`, combining `name` (higher weight, `A`) and `description` (lower weight, `B`) via `setweight(to_tsvector(...))`.
- This column is **not** maintained by application code on every write — it's kept in sync via a **Postgres trigger** (`BEFORE INSERT OR UPDATE ON products`) that recomputes it automatically. This is more reliable than remembering to update it from every `actions/products.actions.ts` write path, and it's a standard, well-understood Postgres pattern for this exact problem.
- A `GIN` index on `searchVector` makes lookups fast even as the catalog grows.
- **Not yet added to the actual `db/schema/products.ts` file** — unlike the earlier `isTrending`/`salesCount` columns (which were plain typed columns), this one depends on a hand-written trigger function that has to be created in a raw SQL migration alongside the column. Flagging it here as a required addition for whoever implements this milestone, rather than half-adding just the column without its trigger.
- Query pattern: `to_tsquery` (or `websearch_to_tsquery`, which tolerates more natural typed-in phrasing) matched against `searchVector`, ordered by `ts_rank`.
- Matches product `name`, `description`, and `sku`. **Categories are not included as a separate search result type** — category browsing is already covered by nav/category pages, and mixing result types would complicate the UI for limited benefit at this scale.

## Search UX

### Header search trigger
- Search icon in the `Header` opens a search overlay (shadcn `Command` component — a new primitive for this milestone, not previously listed in `specs/04`, added here specifically because it's the right building block for a command-palette-style search experience).
- Input is debounced (~300ms) before querying, to avoid firing a query on every keystroke.

### Live suggestions (inside the overlay, before hitting "Enter")
- Shows up to 5 top-matching products as the user types: thumbnail, name, price (`PriceDisplay`).
- Below the live results: **"View all results for '{query}'"** — takes the user to the full `/search` page.
- **Empty input state (overlay just opened, nothing typed yet):**
  - **Recent searches** — client-side only (browser storage, last ~5 queries), since this is the real production app and standard browser storage is appropriate here (not a chat-artifact context).
  - **Popular searches** — a short, admin-independent, hardcoded/curated list in `constants/site-config.ts` (e.g. "Wedding Necklace Sets", "Rose Gold Earrings"). Kept simple and editable in code rather than building a "trending searches" analytics feature for v1.

### Full Search Results Page (`/search?q=...`)
- **Reuses** the `ProductGrid`, `FiltersSidebar`, `SortDropdown`, and `Pagination` components already built in the Products & Categories milestone — search results are just a filtered/ranked product set, not a different UI. This avoids building a second, parallel listing UI.
- Default sort for search results is **relevance** (`ts_rank desc`), with the same Newest/Price/Best Selling/Top Rated options available to re-sort.
- Query term is reflected in the page heading ("Results for '{query}'") and the URL, so results are shareable/bookmarkable, consistent with the category/listing pages' URL-driven filter state.
- **Empty results:** shared `EmptyState` component (this is a genuine user-driven empty state, same category as an empty cart/wishlist) — heading like "No results for '{query}'", supporting text suggesting a broader term, and a CTA back to `/products` or to browse categories. Optionally surface the "Popular searches" list here too, so a dead-end search still gives the customer somewhere to go.

## What's intentionally out of scope for v1
- Typo tolerance / fuzzy matching (e.g. via `pg_trgm`) — Postgres full-text search alone doesn't correct typos. If search quality issues show up in practice (customers searching "neaklace" and getting nothing), adding the `pg_trgm` extension as a fallback is a contained, later enhancement — not required for launch.
- Search analytics / "trending searches" derived from real query logs — the curated "Popular searches" list stands in for this at v1.
- Voice search, image search, or any non-text search modality.

## Files this milestone touches (for Claude Code's reference)
- `db/schema/products.ts` — add `searchVector` column (paired with its trigger, written in a raw SQL migration file, not as Drizzle schema syntax)
- `db/migrations/` — the trigger function + trigger migration
- `components/ui/command.tsx` (shadcn-generated, new primitive for this milestone)
- `features/products/components/SearchOverlay.tsx`, `SearchSuggestionItem.tsx`
- `app/(storefront)/search/page.tsx` (composes existing `ProductGrid`/`FiltersSidebar`/`SortDropdown`/`Pagination`)
- `hooks/use-recent-searches.ts` (browser-storage backed)
- `constants/site-config.ts` — curated "Popular searches" list
- `actions/products.actions.ts` — add `searchProducts(query, filters, sort, page)` alongside the existing `getProducts`
