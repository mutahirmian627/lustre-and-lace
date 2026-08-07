import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  categories,
  products,
  productVariants,
  productImages,
  reviews,
  user,
} from "./schema";
import { auth } from "@/lib/auth";

/**
 * Local-dev-only sample catalog so the storefront has something real to
 * render while there's no admin UI yet to create it by hand. Never run
 * against production — this is not part of db/seed.ts on purpose.
 */

function picsum(seed: string) {
  return `https://picsum.photos/seed/${seed}/800/800`;
}

async function upsertCategory(input: {
  name: string;
  slug: string;
  parentId?: string | null;
  displayOrder: number;
}) {
  const existing = await db.query.categories.findFirst({ where: eq(categories.slug, input.slug) });
  if (existing) return existing;

  const [created] = await db
    .insert(categories)
    .values({
      name: input.name,
      slug: input.slug,
      parentId: input.parentId ?? null,
      displayOrder: input.displayOrder,
    })
    .returning();
  return created;
}

async function upsertProduct(input: {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  basePrice: string;
  compareAtPrice?: string;
  isTrending?: boolean;
  isFeatured?: boolean;
  salesCount?: number;
  variants: { name: string; attributes: Record<string, string>; price: string; stockQuantity: number; isDefault?: boolean }[];
}) {
  const existing = await db.query.products.findFirst({ where: eq(products.slug, input.slug) });
  if (existing) return existing;

  const [product] = await db
    .insert(products)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      basePrice: input.basePrice,
      compareAtPrice: input.compareAtPrice,
      isTrending: input.isTrending ?? false,
      isFeatured: input.isFeatured ?? false,
      salesCount: input.salesCount ?? 0,
    })
    .returning();

  const insertedVariants = await db
    .insert(productVariants)
    .values(
      input.variants.map((v) => ({
        productId: product.id,
        name: v.name,
        attributes: v.attributes,
        price: v.price,
        stockQuantity: v.stockQuantity,
        isDefault: v.isDefault ?? false,
      }))
    )
    .returning();

  await db.insert(productImages).values([
    { productId: product.id, url: picsum(input.slug + "-1"), isPrimary: true, displayOrder: 0 },
    { productId: product.id, url: picsum(input.slug + "-2"), isPrimary: false, displayOrder: 1 },
  ]);

  return { ...product, variants: insertedVariants };
}

async function ensureTestCustomer() {
  const email = "amina@example.com";
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (existing) return existing;

  await auth.api.signUpEmail({ body: { name: "Amina Khan", email, password: "test-password-1" } });
  const [updated] = await db
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.email, email))
    .returning();
  return updated;
}

async function main() {
  const necklaces = await upsertCategory({ name: "Necklaces", slug: "necklaces", displayOrder: 0 });
  const earrings = await upsertCategory({ name: "Earrings", slug: "earrings", displayOrder: 1 });
  const bangles = await upsertCategory({ name: "Bangles", slug: "bangles", displayOrder: 2 });
  const rings = await upsertCategory({ name: "Rings", slug: "rings", displayOrder: 3 });
  await upsertCategory({ name: "Wedding Collection", slug: "wedding-collection", displayOrder: 4 });
  await upsertCategory({ name: "Chokers", slug: "chokers", parentId: necklaces.id, displayOrder: 0 });
  await upsertCategory({ name: "Pendant Necklaces", slug: "pendant-necklaces", parentId: necklaces.id, displayOrder: 1 });

  const necklace1 = await upsertProduct({
    name: "Rose Gold Pendant Necklace",
    slug: "rose-gold-pendant-necklace",
    description:
      "A delicate pendant necklace finished in rose gold plating, perfect for everyday elegance or layering.",
    categoryId: necklaces.id,
    basePrice: "2500.00",
    compareAtPrice: "3200.00",
    isTrending: true,
    isFeatured: true,
    salesCount: 42,
    variants: [
      { name: "Rose Gold Plated", attributes: { plating: "Rose Gold Plated" }, price: "2500.00", stockQuantity: 18, isDefault: true },
      { name: "Gold Plated", attributes: { plating: "Gold Plated" }, price: "2600.00", stockQuantity: 3 },
    ],
  });

  await upsertProduct({
    name: "Pearl Drop Earrings",
    slug: "pearl-drop-earrings",
    description: "Timeless pearl drop earrings with a silver-plated finish — a versatile everyday staple.",
    categoryId: earrings.id,
    basePrice: "1800.00",
    isTrending: true,
    salesCount: 30,
    variants: [
      { name: "Silver Plated", attributes: { plating: "Silver Plated" }, price: "1800.00", stockQuantity: 25, isDefault: true },
    ],
  });

  await upsertProduct({
    name: "Everyday Stud Earrings",
    slug: "everyday-stud-earrings",
    description: "Simple, comfortable stud earrings for daily wear, available in gold and silver plating.",
    categoryId: earrings.id,
    basePrice: "900.00",
    salesCount: 87,
    variants: [
      { name: "Gold Plated", attributes: { plating: "Gold Plated" }, price: "900.00", stockQuantity: 40, isDefault: true },
      { name: "Silver Plated", attributes: { plating: "Silver Plated" }, price: "900.00", stockQuantity: 0 },
    ],
  });

  await upsertProduct({
    name: "Kundan Bangles Set",
    slug: "kundan-bangles-set",
    description: "A set of four kundan-inspired bangles in antique gold — a statement piece for festive occasions.",
    categoryId: bangles.id,
    basePrice: "3500.00",
    salesCount: 12,
    variants: [
      { name: "Small", attributes: { plating: "Antique Gold", size: "Small" }, price: "3500.00", stockQuantity: 4 },
      { name: "Medium", attributes: { plating: "Antique Gold", size: "Medium" }, price: "3500.00", stockQuantity: 4, isDefault: true },
      { name: "Large", attributes: { plating: "Antique Gold", size: "Large" }, price: "3500.00", stockQuantity: 0 },
    ],
  });

  const ring1 = await upsertProduct({
    name: "Statement Cocktail Ring",
    slug: "statement-cocktail-ring",
    description: "A bold cocktail ring with a multicolor stone cluster — designed to be the centerpiece of any outfit.",
    categoryId: rings.id,
    basePrice: "1600.00",
    salesCount: 8,
    variants: [
      { name: "Adjustable", attributes: { color: "Multicolor", size: "Adjustable" }, price: "1600.00", stockQuantity: 15, isDefault: true },
    ],
  });

  await upsertProduct({
    name: "Bridal Choker Set",
    slug: "bridal-choker-set",
    description:
      "An elaborate choker and earring set designed for brides — rich detailing finished in gold plating.",
    categoryId: necklaces.id,
    basePrice: "6500.00",
    compareAtPrice: "7800.00",
    isFeatured: true,
    salesCount: 5,
    variants: [
      { name: "Gold Plated", attributes: { plating: "Gold Plated" }, price: "6500.00", stockQuantity: 6, isDefault: true },
    ],
  });

  const customer = await ensureTestCustomer();
  const existingReviews = await db.query.reviews.findFirst({ where: eq(reviews.userId, customer.id) });
  if (!existingReviews) {
    await db.insert(reviews).values([
      {
        productId: necklace1.id,
        userId: customer.id,
        rating: 5,
        title: "Beautiful piece",
        comment: "Even better than the photos — the rose gold finish is gorgeous and hasn't faded after weeks of wear.",
        isApproved: true,
      },
      {
        productId: ring1.id,
        userId: customer.id,
        rating: 4,
        title: "Great statement ring",
        comment: "Gets compliments every time I wear it. Sizing runs a little large so I'd size down.",
        isApproved: true,
      },
    ]);

    // These reviews are inserted pre-approved (bypassing the normal
    // submit->admin-approve flow), so the maintained rating columns need a
    // matching manual update — normally Milestone 11's approve action does this.
    await db.update(products).set({ ratingAverage: "5.00", ratingCount: 1 }).where(eq(products.id, necklace1.id));
    await db.update(products).set({ ratingAverage: "4.00", ratingCount: 1 }).where(eq(products.id, ring1.id));
  }

  console.log("Dev sample data seeded.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Dev seed failed:", error);
    process.exit(1);
  });
