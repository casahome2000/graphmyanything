import { describe, expect, it } from "vitest";
import { RANGE_CANONICAL, RANGE_DESCRIBE } from "../src/lib/range.js";
import { parseRange } from "../src/lib/summary.js";

describe("documented query/chart ranges", () => {
  it("RANGE_DESCRIBE lists canonical values including 14d and 30d", () => {
    expect(RANGE_DESCRIBE).toBe("7d|14d|30d|90d|1y|all");
    expect(RANGE_CANONICAL).toContain("14d");
    expect(RANGE_CANONICAL).toContain("30d");
  });

  it.each(["14d", "30d"] as const)("parseRange accepts %s", (range) => {
    const now = 1_700_000_000;
    const { fromTs, toTs } = parseRange(range, now);
    expect(toTs).toBe(now);
    const days = range === "14d" ? 14 : 30;
    expect(fromTs).toBe(now - days * 86400);
  });
});