import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const coreDist = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../core/dist",
);

export default defineConfig({
  resolve: {
    alias: {
      "@graphmyanything/core/lttb.js": path.join(coreDist, "lttb.js"),
      "@graphmyanything/core/summary.js": path.join(coreDist, "summary.js"),
      "@graphmyanything/core/insight.js": path.join(coreDist, "insight.js"),
      "@graphmyanything/core/terse-summary.js": path.join(
        coreDist,
        "terse-summary.js",
      ),
      "@graphmyanything/core/tokens.js": path.join(coreDist, "tokens.js"),
      "@graphmyanything/core/query.js": path.join(coreDist, "query.js"),
      "@graphmyanything/core/svg-chart.js": path.join(coreDist, "svg-chart.js"),
      "@graphmyanything/core": path.join(coreDist, "index.js"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    testTimeout: 15_000,
  },
});