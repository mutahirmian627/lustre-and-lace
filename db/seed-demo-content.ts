import { eq, inArray, like, sql } from "drizzle-orm";
import { db } from "./index";
import { categories, products, productVariants, productImages, reviews, user, coupons } from "./schema";

/**
 * Demo catalogue so the storefront has real-looking content: ~38 more products across every
 * category, product photos drawn by scripts/generate-demo-images.js, a few demo customers with
 * approved reviews, and coupons. Safe to re-run (everything is matched by slug/email/code).
 * Demo customers use @demo.lustreandlace.test addresses, so they can be found and removed with
 * one query. Not for production.
 */

type Kind = "necklace" | "pendant" | "choker" | "earrings" | "studs" | "jhumka" | "bangles" | "ring" | "set";

/** Small deterministic hash so re-runs always produce the same stock/sales/reviews. */
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}
const pick = <T,>(items: T[], seed: string) => items[Math.floor(hash(seed) * items.length)];

const slugify = (name: string) =>
  name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const BLURB: Record<Kind, string> = {
  necklace: "A graceful necklace that sits beautifully on the collarbone, light enough for all-day wear.",
  pendant: "A delicate pendant on a fine chain, made to be worn alone or layered with your favourites.",
  choker: "A close-fitting choker with a rich finish that frames the neckline and lifts any outfit.",
  earrings: "Lightweight earrings with a comfortable fit, designed to move and catch the light.",
  studs: "Comfortable everyday studs with a secure back, small enough for daily wear and sparkly enough to notice.",
  jhumka: "Traditional jhumkas with intricate detailing and a gentle sway, perfect with festive and bridal looks.",
  bangles: "Bangles with a smooth, comfortable inner edge and a lasting plated finish.",
  ring: "A comfortable, adjustable ring that sits nicely on its own or stacked with others.",
  set: "A coordinated set, so the necklace and earrings match perfectly and the look comes together at once.",
};
const CARE = "Plated jewellery lasts longest when kept dry: put it on after perfume and store it in the pouch provided.";

interface Item {
  name: string;
  category: string;
  kind: Kind;
  price: number;
  compareAt?: number;
  trending?: boolean;
  featured?: boolean;
  detail: string;
}

const ITEMS: Item[] = [
  // Necklaces
  { name: "Pearl Strand Necklace", category: "necklaces", kind: "necklace", price: 2800, detail: "Hand-strung faux pearls with a gold-plated clasp." },
  { name: "Layered Gold Chain Necklace", category: "necklaces", kind: "necklace", price: 2200, trending: true, detail: "Two fine chains in one, for an effortless layered look." },
  { name: "Kundan Statement Necklace", category: "necklaces", kind: "necklace", price: 4200, compareAt: 5200, featured: true, detail: "Kundan-style stones set in antique gold for festive occasions." },
  { name: "Crystal Collar Necklace", category: "necklaces", kind: "necklace", price: 3100, detail: "Sparkling crystals that catch the light from every angle." },
  // Pendants
  { name: "Heart Locket Pendant", category: "pendant-necklaces", kind: "pendant", price: 1900, detail: "A small heart locket that opens to hold a tiny photo." },
  { name: "Evil Eye Pendant Necklace", category: "pendant-necklaces", kind: "pendant", price: 1500, trending: true, detail: "A protective evil-eye charm on a dainty chain." },
  { name: "Moonstone Teardrop Pendant", category: "pendant-necklaces", kind: "pendant", price: 2300, compareAt: 2900, detail: "A glowing teardrop stone in a polished gold setting." },
  { name: "Initial Letter Pendant", category: "pendant-necklaces", kind: "pendant", price: 1200, trending: true, detail: "A personal touch: choose the letter that matters to you." },
  // Chokers
  { name: "Velvet Pearl Choker", category: "chokers", kind: "choker", price: 2100, detail: "Soft velvet band finished with a single pearl drop." },
  { name: "Diamanté Tennis Choker", category: "chokers", kind: "choker", price: 3400, trending: true, detail: "A continuous line of sparkling stones for an elegant evening look." },
  { name: "Antique Gold Choker", category: "chokers", kind: "choker", price: 2900, compareAt: 3600, detail: "Traditional engraving in a warm antique finish." },
  // Earrings
  { name: "Gold Hoop Earrings", category: "earrings", kind: "studs", price: 1400, trending: true, detail: "Classic mid-size hoops with a smooth, lightweight feel." },
  { name: "Crystal Chandelier Earrings", category: "earrings", kind: "earrings", price: 2600, detail: "Tiers of crystal that sparkle with every movement." },
  { name: "Pearl Cluster Earrings", category: "earrings", kind: "earrings", price: 1700, detail: "A cluster of pearls for soft, polished elegance." },
  // Jhumkas
  { name: "Classic Gold Jhumkas", category: "jhumkas", kind: "jhumka", price: 2200, trending: true, detail: "Bell-shaped jhumkas with pearl drops." },
  { name: "Oxidised Silver Jhumkas", category: "jhumkas", kind: "jhumka", price: 1600, detail: "A bohemian, oxidised finish that pairs well with casual wear." },
  { name: "Meenakari Jhumka Earrings", category: "jhumkas", kind: "jhumka", price: 2400, compareAt: 3000, detail: "Colourful meenakari-style detailing on a gold base." },
  { name: "Pearl Drop Jhumkas", category: "jhumkas", kind: "jhumka", price: 2000, featured: true, detail: "Pearls cascading from an ornate dome." },
  // Studs & hoops
  { name: "Minimal Pearl Studs", category: "studs-hoops", kind: "studs", price: 800, detail: "A single pearl on a gold-plated post, for every day." },
  { name: "Zircon Stud Set (3 pairs)", category: "studs-hoops", kind: "studs", price: 1500, compareAt: 1900, detail: "Three sizes so you can mix, match or stack." },
  { name: "Huggie Hoop Earrings", category: "studs-hoops", kind: "studs", price: 1100, detail: "Small hoops that hug the lobe and stay put." },
  // Bangles
  { name: "Antique Gold Bangles (Set of 6)", category: "bangles", kind: "bangles", price: 4200, featured: true, detail: "Six bangles with engraved detailing, made to be worn together." },
  { name: "Pearl Bangle Pair", category: "bangles", kind: "bangles", price: 2600, detail: "A matching pair studded with pearls." },
  { name: "Glass Bead Bangles Set", category: "bangles", kind: "bangles", price: 1800, trending: true, detail: "Colourful beadwork in a comfortable stackable set." },
  { name: "Sparkle Cuff Bangle", category: "bangles", kind: "bangles", price: 2400, compareAt: 3000, detail: "An open cuff that fits most wrist sizes." },
  // Rings
  { name: "Solitaire Crystal Ring", category: "rings", kind: "ring", price: 1300, detail: "A single brilliant stone in a classic setting." },
  { name: "Stackable Ring Trio", category: "rings", kind: "ring", price: 1700, trending: true, detail: "Three slim bands to wear together or apart." },
  { name: "Adjustable Floral Ring", category: "rings", kind: "ring", price: 1100, detail: "A petal-shaped ring with an easy adjustable band." },
  { name: "Pearl Dome Ring", category: "rings", kind: "ring", price: 1450, detail: "A glossy pearl dome that goes with everything." },
  // Wedding collection
  { name: "Bridal Kundan Necklace Set", category: "wedding-collection", kind: "set", price: 12500, compareAt: 14500, featured: true, detail: "Necklace, earrings and tikka, made for the bride." },
  { name: "Polki Bridal Jewellery Set", category: "wedding-collection", kind: "set", price: 9800, featured: true, detail: "Polki-style stones in a regal, richly detailed design." },
  { name: "Mehndi Day Floral Set", category: "wedding-collection", kind: "set", price: 5200, detail: "Fresh, floral-inspired pieces for the mehndi celebrations." },
  { name: "Nikkah Pearl Set", category: "wedding-collection", kind: "set", price: 7400, compareAt: 8800, detail: "Understated pearls for a graceful nikkah look." },
  // Jewellery sets
  { name: "Everyday Pearl Set", category: "jewellery-sets", kind: "set", price: 3800, detail: "A pearl necklace with matching studs, ready for work or dinner." },
  { name: "Emerald Green Party Set", category: "jewellery-sets", kind: "set", price: 6200, trending: true, detail: "Deep green stones that stand out on any party outfit." },
  { name: "Rose Gold Crystal Set", category: "jewellery-sets", kind: "set", price: 4900, compareAt: 5900, detail: "Soft rose-gold plating with a shimmer of crystals." },
  { name: "Festive Jhumka and Necklace Set", category: "jewellery-sets", kind: "set", price: 7200, detail: "A traditional necklace with matching jhumkas for Eid and weddings." },
];

/** Old sample products from db/seed-dev-data.ts: swap their random photos for the drawn ones. */
const EXISTING_KINDS: Record<string, Kind> = {
  "rose-gold-pendant-necklace": "pendant",
  "pearl-drop-earrings": "earrings",
  "everyday-stud-earrings": "studs",
  "kundan-bangles-set": "bangles",
  "statement-cocktail-ring": "ring",
  "bridal-choker-set": "set",
};

/** Every category the demo products use, parents first, so this also works on an empty database. */
const NEW_CATEGORIES = [
  { slug: "necklaces", name: "Necklaces", parent: null, order: 0 },
  { slug: "earrings", name: "Earrings", parent: null, order: 1 },
  { slug: "bangles", name: "Bangles", parent: null, order: 2 },
  { slug: "rings", name: "Rings", parent: null, order: 3 },
  { slug: "wedding-collection", name: "Wedding Collection", parent: null, order: 4 },
  { slug: "jewellery-sets", name: "Jewellery Sets", parent: null, order: 5 },
  { slug: "chokers", name: "Chokers", parent: "necklaces", order: 0 },
  { slug: "pendant-necklaces", name: "Pendant Necklaces", parent: "necklaces", order: 1 },
  { slug: "jhumkas", name: "Jhumkas", parent: "earrings", order: 0 },
  { slug: "studs-hoops", name: "Studs & Hoops", parent: "earrings", order: 1 },
];

const REVIEWERS = ["Ayesha Malik", "Fatima Noor", "Hira Siddiqui", "Sana Ahmed", "Zainab Raza", "Mahnoor Ali", "Iqra Hussain", "Rabia Sheikh"];

const REVIEW_TEXT: { rating: number; title: string; comment: string }[] = [
  { rating: 5, title: "Even prettier in person", comment: "The finish looks just like the photos and it feels sturdy. I got so many compliments at the wedding." },
  { rating: 5, title: "Perfect gift", comment: "Bought this for my sister and she loved it. Arrived well packed in a lovely pouch." },
  { rating: 5, title: "Great value", comment: "I was unsure about artificial jewellery online but this is lovely quality for the price." },
  { rating: 4, title: "Lovely, runs a little small", comment: "Really pretty and lightweight. It's a touch smaller than I expected, but I still love it." },
  { rating: 5, title: "Wear it every day", comment: "Comfortable enough for all-day wear and the plating hasn't faded after weeks." },
  { rating: 4, title: "Nice and sparkly", comment: "Catches the light beautifully. Delivery took four days, which was fine." },
  { rating: 5, title: "Exactly what I wanted", comment: "Matched my outfit perfectly. Will order the matching set next." },
  { rating: 3, title: "Good, not amazing", comment: "Pretty design but the clasp is a bit stiff. Customer support helped quickly though." },
  { rating: 5, title: "Elegant and classy", comment: "Looks far more expensive than it is. Highly recommend." },
  { rating: 4, title: "Happy with it", comment: "Good quality and fast delivery. Would buy from Lustre & Lace again." },
  { rating: 5, title: "Bridal favourite", comment: "Wore this for my event and everyone asked where it was from. Beautiful craftsmanship." },
  { rating: 4, title: "Pretty and light", comment: "Doesn't pull on the ears at all, even after a long evening." },
];

function variantsFor(kind: Kind, price: number, seed: string) {
  const stock = (i: number) => {
    const r = hash(seed + i);
    return r < 0.12 ? 0 : r < 0.3 ? 2 + Math.floor(r * 10) : 8 + Math.floor(r * 30);
  };
  const money = (n: number) => n.toFixed(2);
  if (kind === "bangles") {
    return ["2.4", "2.6", "2.8"].map((size, i) => ({
      name: size,
      attributes: { size },
      price: money(price),
      stockQuantity: stock(i),
      isDefault: i === 1,
    }));
  }
  if (kind === "ring") {
    return ["Adjustable", "Size 7", "Size 8"].slice(0, 2).map((size, i) => ({
      name: size,
      attributes: { size },
      price: money(price),
      stockQuantity: stock(i),
      isDefault: i === 0,
    }));
  }
  const platings = kind === "set" || kind === "necklace" || kind === "choker" || kind === "pendant"
    ? ["Gold Plated", "Rose Gold Plated"]
    : ["Gold Plated", "Silver Plated"];
  return platings.map((plating, i) => ({
    name: plating,
    attributes: { plating },
    price: money(price + i * 100),
    stockQuantity: stock(i),
    isDefault: i === 0,
  }));
}

async function ensureCategories() {
  const bySlug = new Map<string, string>();
  for (const c of await db.select({ id: categories.id, slug: categories.slug }).from(categories)) bySlug.set(c.slug, c.id);
  for (const c of NEW_CATEGORIES) {
    if (bySlug.has(c.slug)) {
      // Repair rows left parentless by an earlier partial run.
      if (c.parent && bySlug.get(c.parent)) {
        await db.update(categories).set({ parentId: bySlug.get(c.parent) }).where(eq(categories.slug, c.slug));
      }
      continue;
    }
    const [created] = await db
      .insert(categories)
      .values({ name: c.name, slug: c.slug, parentId: c.parent ? bySlug.get(c.parent) : null, displayOrder: c.order })
      .returning({ id: categories.id });
    bySlug.set(c.slug, created.id);
  }
  return bySlug;
}

const demoImage = (kind: Kind, n: number) => `/demo/${kind}-${n}.jpg`;

async function seedProducts(categoryIds: Map<string, string>) {
  let created = 0;
  for (const item of ITEMS) {
    const slug = slugify(item.name);
    const existing = await db.query.products.findFirst({ where: eq(products.slug, slug), columns: { id: true } });
    if (existing) continue;
    const categoryId = categoryIds.get(item.category);
    if (!categoryId) throw new Error(`Missing category ${item.category}`);

    const [product] = await db
      .insert(products)
      .values({
        name: item.name,
        slug,
        description: `${item.detail} ${BLURB[item.kind]} ${CARE}`,
        categoryId,
        basePrice: item.price.toFixed(2),
        compareAtPrice: item.compareAt?.toFixed(2),
        isTrending: item.trending ?? false,
        isFeatured: item.featured ?? false,
        salesCount: Math.floor(hash(slug + "sales") * 90) + (item.trending ? 40 : 0),
      })
      .returning({ id: products.id });

    await db.insert(productVariants).values(
      variantsFor(item.kind, item.price, slug).map((v) => ({ productId: product.id, ...v }))
    );
    const first = 1 + Math.floor(hash(slug + "img") * 3);
    await db.insert(productImages).values([
      { productId: product.id, url: demoImage(item.kind, first), isPrimary: true, displayOrder: 0 },
      { productId: product.id, url: demoImage(item.kind, (first % 3) + 1), isPrimary: false, displayOrder: 1 },
    ]);
    created++;
  }
  return created;
}

/** Only touches images that are still the random placeholder photos, never ones uploaded through the admin. */
async function swapOldPlaceholderPhotos() {
  let swapped = 0;
  for (const [slug, kind] of Object.entries(EXISTING_KINDS)) {
    const product = await db.query.products.findFirst({ where: eq(products.slug, slug), columns: { id: true } });
    if (!product) continue;
    const imgs = await db.query.productImages.findMany({ where: eq(productImages.productId, product.id) });
    const old = imgs.filter((i) => i.url.includes("picsum.photos"));
    for (const [index, img] of old.entries()) {
      await db.update(productImages).set({ url: demoImage(kind, ((index + 1) % 3) + 1) }).where(eq(productImages.id, img.id));
      swapped++;
    }
  }
  return swapped;
}

async function seedReviews() {
  const reviewerIds: string[] = [];
  for (const name of REVIEWERS) {
    const email = `demo.${name.split(" ")[0].toLowerCase()}@demo.lustreandlace.test`;
    const existing = await db.query.user.findFirst({ where: eq(user.email, email), columns: { id: true } });
    if (existing) {
      reviewerIds.push(existing.id);
      continue;
    }
    const [created] = await db.insert(user).values({ name, email, emailVerified: true }).returning({ id: user.id });
    reviewerIds.push(created.id);
  }

  const all = await db.select({ id: products.id, slug: products.slug }).from(products);
  const alreadyReviewed = new Set(
    (await db.selectDistinct({ productId: reviews.productId }).from(reviews).where(inArray(reviews.userId, reviewerIds))).map((r) => r.productId)
  );

  let added = 0;
  for (const product of all) {
    if (alreadyReviewed.has(product.id) || hash(product.slug + "rev") < 0.25) continue;
    const count = 2 + Math.floor(hash(product.slug + "n") * 3);
    const used = new Set<string>();
    for (let i = 0; i < count; i++) {
      const reviewer = pick(reviewerIds.filter((id) => !used.has(id)), product.slug + "who" + i);
      used.add(reviewer);
      const text = pick(REVIEW_TEXT, product.slug + "text" + i);
      await db.insert(reviews).values({
        productId: product.id,
        userId: reviewer,
        rating: text.rating,
        title: text.title,
        comment: text.comment,
        isApproved: true,
        createdAt: new Date(Date.now() - Math.floor(hash(product.slug + "d" + i) * 90 + 1) * 86_400_000),
      });
      added++;
    }
  }

  // Keep the stored averages in step with the approved reviews, like the admin approve action does.
  await db.execute(sql`
    update products p set
      rating_average = coalesce((select round(avg(r.rating)::numeric, 2) from reviews r where r.product_id = p.id and r.is_approved and r.deleted_at is null), 0),
      rating_count = (select count(*)::int from reviews r where r.product_id = p.id and r.is_approved and r.deleted_at is null)
  `);
  return added;
}

async function seedCoupons() {
  const wanted = [
    { code: "EID15", type: "percentage" as const, value: "15.00", maxDiscountAmount: "2000.00", minOrderAmount: "4000.00" },
    { code: "FREESHIP", type: "fixed" as const, value: "250.00", minOrderAmount: "2500.00" },
  ];
  for (const c of wanted) {
    const existing = await db.query.coupons.findFirst({ where: eq(coupons.code, c.code), columns: { id: true } });
    if (!existing) await db.insert(coupons).values({ ...c, isActive: true });
  }
}

async function main() {
  const categoryIds = await ensureCategories();
  const created = await seedProducts(categoryIds);
  const swapped = await swapOldPlaceholderPhotos();
  const reviewsAdded = await seedReviews();
  await seedCoupons();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(products).where(like(products.slug, "%"));
  console.log(`Demo content: ${created} new products (${n} total), ${swapped} photos replaced, ${reviewsAdded} reviews added.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exit(1);
  });
