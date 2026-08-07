import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    // Every current unit test targets pure business logic (specs/16) with
    // no DOM dependency — "node" avoids a jsdom v30/Node webidl
    // incompatibility that "jsdom" hits in this environment. Switch back
    // to "jsdom" (and reinstate tests/setup.ts) if component tests are
    // ever added here.
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
  },
});
