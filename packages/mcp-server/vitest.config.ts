import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 15_000,
    // entry/cli spawn tests run `npm run build` in beforeAll; avoid parallel file runs racing tsc.
    fileParallelism: false,
  },
});