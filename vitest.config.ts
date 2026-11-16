import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests (audit P2 #24): pure-logic suites only — the
// dictionary, the My Collaborations partition, and small
// lib helpers. Component/DOM tests are deliberately out of
// scope for this first setup.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
