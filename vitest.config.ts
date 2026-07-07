import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@fencier/adapters": new URL("./packages/adapters/src/index.ts", import.meta.url).pathname,
      "@fencier/core": new URL("./packages/core/src/index.ts", import.meta.url).pathname,
    },
  },
  test: {
    include: ["packages/**/*.test.ts"],
  },
});
