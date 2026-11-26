import type { DataPoint } from "./lttb.js";

export type MetricSummary = {
  latest: number | null;
  min: number | null;
  max: number | null;
  mean: number | null;
  count: number;
  trend: "up" | "down" | "flat" | "insufficient";
  pct_change: number | null;
  first_ts: number | null;
  last_ts: number | null;
};

export function computeSummary(points: DataPoint[]): MetricSummary {
  if (points.length === 0) {
    return {
      latest: null,
      min: null,
      max: null,
      mean: null,
      count: 0,
      trend: "insufficient",
      pct_change: null,
      first_ts: null,
      last_ts: null,
    };
  }

  let min = points[0].value;
  let max = points[0].value;
  let sum = 0;
  for (const p of points) {
    if (p.value < min) min = p.value;
    if (p.value > max) max = p.value;
    sum += p.value;
  }
  const mean = sum / points.length;
  const latest = points[points.length - 1].value;
  const first = points[0].value;

  let pct_change: number | null = null;
  let trend: MetricSummary["trend"] = "flat";
  if (first !== 0) {
    pct_change = ((latest - first) / Math.abs(first)) * 100;
    if (Math.abs(pct_change) < 0.5) trend = "flat";
    else trend = pct_change > 0 ? "up" : "down";
  } else if (latest !== first) {
    pct_change = latest > 0 ? 100 : -100;
    trend = latest > first ? "up" : "down";
  }

  if (points.length < 2) {
    trend = "insufficient";
  }

  return {
    latest,
    min,
    max,
    mean,
    count: points.length,
    trend,
    pct_change:
      pct_change != null ? Math.round(pct_change * 100) / 100 : null,
    first_ts: points[0].ts,
    last_ts: points[points.length - 1].ts,
  };
}

export function parseRange(
  range: string | undefined,
  nowSec = Math.floor(Date.now() / 1000),
): { fromTs?: number; toTs: number } {
  const toTs = nowSec;
  if (!range || range === "all") {
    return { toTs };
  }

  const m = range.match(/^(\d+)([dhwmy])$/i);
  if (!m) {
    throw new Error(
      `Invalid range "${range}". Use e.g. 7d, 14d, 30d, 90d, 1y, or all.`,
    );
  }
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const day = 86400;
  let seconds: number;
  switch (unit) {
    case "d":
      seconds = n * day;
      break;
    case "h":
      seconds = n * 3600;
      break;
    case "w":
      seconds = n * 7 * day;
      break;
    case "m":
      seconds = n * 30 * day;
      break;
    case "y":
      seconds = n * 365 * day;
      break;
    default:
      seconds = n * day;
  }
  return { fromTs: toTs - seconds, toTs };
}

/** Shrink JSON string to fit approximate token budget (chars ≈ 4 tokens). */
export function fitTokenBudget(json: string, tokenBudget: number): string {
  const maxChars = Math.max(80, tokenBudget * 4);
  if (json.length <= maxChars) return json;
  return json.slice(0, maxChars - 1) + "…";
}