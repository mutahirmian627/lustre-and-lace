import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./index";

/**
 * drizzle-kit's own `migrate` CLI command uses the WebSocket-based Neon
 * driver, which doesn't work in this sandboxed environment. The app itself
 * already uses the HTTP driver (db/index.ts), so this runs migrations
 * through that same driver instead of drizzle-kit's CLI.
 */
async function main() {
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Migrations applied.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
