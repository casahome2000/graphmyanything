import { describe, expect, it } from "vitest";
import { estimateTokens } from "../src/lib/tokens.js";
import { GMA_TOOL_CATALOG, gmaToolsListJson } from "../src/tool-catalog.js";

describe("GMA_TOOL_CATALOG", () => {
  it("chart tool lists labels enum", () => {
    const chart = GMA_TOOL_CATALOG.find((t) => t.name === "chart");
    const props = chart?.inputSchema.properties as Record<string, { enum?: string[] }>;
    expect(props.labels?.enum).toEqual(["none", "last", "extremes", "all"]);
  });

  it("tools/list payload stays under a reasonable token budget", () => {
    const json = gmaToolsListJson();
    const tokens = estimateTokens(JSON.parse(json));
    expect(tokens).toBeLessThan(900);
    expect(tokens).toBeGreaterThan(300);
  });
});