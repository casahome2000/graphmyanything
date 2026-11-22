import { describe, expect, it } from "vitest";
import { generateInsight } from "../src/lib/insight.js";

describe("generateInsight", () => {
  it("produces forecast and summary text", () => {
    const points = Array.from({ length: 30 }, (_, i) => ({
      ts: 1_700_000_000 + i * 86400,
      value: 10_000 + i * 100,
    }));
    const r = generateInsight("stripe.mrr", points, "90d");
    expect(r.forecast.next_values).toHaveLength(3);
    expect(r.summary).toContain("stripe.mrr");
    expect(r.stats.trend).toBe("up");
  });

  it("flags spike anomaly", () => {
    const points = Array.from({ length: 20 }, (_, i) => ({
      ts: i,
      value: i === 10 ? 500 : 10,
    }));
    const r = generateInsight("test.spike", points, "all");
    expect(r.anomalies.length).toBeGreaterThan(0);
  });
});