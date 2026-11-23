import { describe, expect, it } from "vitest";
import {
  monthNormalizedAmountCents,
  monthsInBillingPeriod,
} from "../src/mrr/normalize.js";

describe("monthsInBillingPeriod", () => {
  it("normalizes annual to twelfths", () => {
    expect(monthsInBillingPeriod("year", 1)).toBe(12);
    const mrr = monthNormalizedAmountCents(120_00, 1, "year", 1);
    expect(mrr).toBeCloseTo(10_00, 5);
  });

  it("normalizes weekly with 52/12", () => {
    expect(monthsInBillingPeriod("week", 1)).toBeCloseTo(12 / 52, 8);
    const mrr = monthNormalizedAmountCents(10_000, 1, "week", 1);
    expect(mrr).toBeCloseTo((10_000 * 52) / 12, 4);
  });

  it("respects interval_count on monthly", () => {
    const mrr = monthNormalizedAmountCents(30_00, 1, "month", 3);
    expect(mrr).toBe(10_00);
  });
});