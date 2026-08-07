-- Postgres full-text search for products (specs/07-search.md).
-- search_vector isn't modeled in db/schema/products.ts: it's written only by
-- the trigger below, never by application code, so there's nothing for the
-- Drizzle-typed schema to represent. Query it with raw sql`` templates.
ALTER TABLE "products" ADD COLUMN "search_vector" tsvector;
--> statement-breakpoint

-- Name is weighted higher than description so a name match always ranks
-- above a description-only match.
CREATE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description ON "products"
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();
--> statement-breakpoint

-- Backfill existing rows (no-op on a fresh database, matters on re-runs).
UPDATE "products" SET name = name;
--> statement-breakpoint

CREATE INDEX "products_search_vector_idx" ON "products" USING gin ("search_vector");
--> statement-breakpoint

-- Human-readable order reference (specs/10-checkout-and-payments.md), format
-- LL-{year}-{sequence padded to 5}. The sequence never resets — the year in
-- the reference is just a label captured at creation time, not a partition
-- key, so there's no year-boundary reset job to maintain.
CREATE SEQUENCE order_reference_seq START WITH 1 INCREMENT BY 1;
