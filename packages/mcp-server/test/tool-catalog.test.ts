import { describe, expect, it } from "vitest";
import {
  GMA_TOOL_CATALOG,
  gmaPerToolTokenEstimates,
  gmaToolsListJson,
  gmaToolsListTokenEstimate,
} from "../src/tool-catalog.js";

describe("GMA_TOOL_CATALOG", () => {
  it("chart tool lists labels enum", () => {
    const chart = GMA_TOOL_CATALOG.find((t) => t.name === "chart");
    const props = chart?.inputSchema.properties as Record<string, { enum?: string[] }>;
    expect(props.labels?.enum).toEqual(["none", "last", "extremes", "all"]);
  });

  it("tools/list payload stays at or under 650 tokens (chars÷4)", () => {
    expect(gmaToolsListTokenEstimate()).toBeLessThanOrEqual(650);
    expect(gmaToolsListJson().length).toBeGreaterThan(100);
  });

  it("chart schema exposes share and include_embed", () => {
    const chart = GMA_TOOL_CATALOG.find((t) => t.name === "chart");
    const props = chart?.inputSchema.properties as Record<
      string,
      { description?: string; enum?: string[] }
    >;
    expect(props.labels?.enum).toEqual(["none", "last", "extremes", "all"]);
    expect(props.type?.enum).toEqual(["line", "bar", "area"]);
    expect(props.share?.description).toMatch(/share url/i);
    expect(props.include_embed?.description).toMatch(/embed/i);
    expect(chart?.description).toMatch(/chart-guide/);
  });
});

describe("gmaPerToolTokenEstimates", () => {
  it("exposes per-tool token breakdown", () => {
    const est = gmaPerToolTokenEstimates();
    expect(Object.keys(est).sort()).toEqual([
      "chart",
      "forget",
      "insight",
      "query",
      "track",
    ]);
    const total = Object.values(est).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(gmaToolsListTokenEstimate());
  });
});