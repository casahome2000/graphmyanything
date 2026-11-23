import type { MetricSummary } from "./summary.js";

/** Terse keys to shrink query JSON when series is omitted. */
export function terseSummary(s: MetricSummary): Record<string, number | string | null> {
  return {
    l: s.latest,
    mn: s.min,
    mx: s.max,
    mu: s.mean,
    tr: s.trend,
    pct: s.pct_change,
    n: s.count,
  };
}

export type PointsArg = number | "auto";

const AUTO_BUDGET_CUTOFF = 400;

export function resolveIncludeSeries(
  points: PointsArg | undefined,
  tokenBudget: number,
  alsoChart?: boolean,
): { mode: "none" | "lttb"; maxPoints: number } {
  const p = points ?? "auto";
  if (p === 0) return { mode: "none", maxPoints: 0 };
  if (p === "auto") {
    if (alsoChart) return { mode: "none", maxPoints: 0 };
    if (tokenBudget < AUTO_BUDGET_CUTOFF) return { mode: "none", maxPoints: 0 };
    return { mode: "lttb", maxPoints: 50 };
  }
  if (p > 0) return { mode: "lttb", maxPoints: Math.min(500, p) };
  return { mode: "none", maxPoints: 0 };
}