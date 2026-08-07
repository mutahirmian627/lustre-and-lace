/** Turns "Rose Gold Pendant Necklace" into "rose-gold-pendant-necklace" for auto-generated, editable slugs (specs/13). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
