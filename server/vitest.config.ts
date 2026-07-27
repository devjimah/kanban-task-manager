import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["dist/**", "node_modules/**"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 180_000,
    env: {
      MONGOMS_DOWNLOAD_DIR: resolve(import.meta.dirname, "../.cache/mongodb-binaries"),
    },
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts"],
    },
  },
});
