// Single entry point for the entire database schema.
// Both the Drizzle client (db/index.ts) and drizzle.config.ts read from here.

export * from "./users";
export * from "./categories";
export * from "./products";
export * from "./cart";
export * from "./wishlist";
export * from "./coupons";
export * from "./orders";
export * from "./reviews";
export * from "./addresses";
export * from "./settings";
