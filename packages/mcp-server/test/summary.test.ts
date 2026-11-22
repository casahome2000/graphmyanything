import { describe, expect, it } from "vitest";
import { computeSummary, parseRange } from "../src/lib/summary.js";

describe("computeSummary", () => {
  it("handles empty", () => {
    const s = computeSummary([]);
    expect(s.count).toBe(0);
    expect(s.trend).toBe("insufficient");
  });

  it("detects upward trend", () => {
    const s = computeSummary([
      { ts: 1, value: 100 },
      { ts: 2, value: 110 },
      { ts: 3, value: 125 },
    ]);
    expect(s.trend).toBe("up");
    expect(s.pct_change).toBe(25);
    expect(s.mean).toBeCloseTo(111.67, 1);
  });

  it("parses 90d range", () => {
    const now = 1_700_000_000;
    const { fromTs, toTs } = parseRange("90d", now);
    expect(toTs).toBe(now);
    expect(fromTs).toBe(now - 90 * 86400);
  });
});