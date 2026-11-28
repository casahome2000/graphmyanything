import type { DataPoint } from "./lttb.js";
import { xAxisTimeGranularity } from "./svg-chart.js";

const SEC_HOUR = 3600;
const SEC_DAY = 86_400;
export type TimeBucket = "hour" | "day" | "week" | "month";

export function timeBucketForSpan(spanSec: number): TimeBucket {
  const g = xAxisTimeGranularity(spanSec);
  if (g === "intraday") return "hour";
  if (g === "daily") return "day";
  if (g === "monthly") return "week";
  return "month";
}

export function bucketStartTs(ts: number, bucket: TimeBucket): number {
  const d = new Date(ts * 1000);
  if (bucket === "hour") {
    return Math.floor(ts / SEC_HOUR) * SEC_HOUR;
  }
  if (bucket === "day") {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000;
  }
  if (bucket === "week") {
    const dayStart =
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000;
    const day = d.getUTCDay();
    return dayStart - day * SEC_DAY;
  }
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / 1000;
}

/** Last value in each bucket (same aggregation style as time-ordered series). */
export function bucketizeSeries(points: DataPoint[], bucket: TimeBucket): DataPoint[] {
  if (points.length === 0) return [];
  const byBucket = new Map<number, number>();
  const sorted = [...points].sort((a, b) => a.ts - b.ts);
  for (const p of sorted) {
    const start = bucketStartTs(p.ts, bucket);
    byBucket.set(start, p.value);
  }
  return [...byBucket.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, value]) => ({ ts, value }));
}

export type AlignedSeries = {
  bucket: TimeBucket;
  buckets: number[];
  byName: Record<string, (number | null)[]>;
};

export function alignBucketedSeries(
  byMetric: Record<string, DataPoint[]>,
  spanSec: number,
): AlignedSeries {
  const bucket = timeBucketForSpan(spanSec);
  const bucketed: Record<string, DataPoint[]> = {};
  for (const [name, pts] of Object.entries(byMetric)) {
    bucketed[name] = bucketizeSeries(pts, bucket);
  }
  const bucketSet = new Set<number>();
  let minTs = Infinity;
  let maxTs = -Infinity;
  for (const pts of Object.values(bucketed)) {
    for (const p of pts) {
      bucketSet.add(p.ts);
      minTs = Math.min(minTs, p.ts);
      maxTs = Math.max(maxTs, p.ts);
    }
  }
  const buckets = [...bucketSet].sort((a, b) => a - b);
  if (buckets.length === 0 && Number.isFinite(minTs)) {
    buckets.push(minTs);
  }
  const byName: Record<string, (number | null)[]> = {};
  for (const [name, pts] of Object.entries(bucketed)) {
    const map = new Map(pts.map((p) => [p.ts, p.value]));
    byName[name] = buckets.map((ts) => map.get(ts) ?? null);
  }
  return { bucket, buckets, byName };
}

export function alignedToDataPoints(
  buckets: number[],
  values: (number | null)[],
): DataPoint[] {
  const out: DataPoint[] = [];
  for (let i = 0; i < buckets.length; i++) {
    const v = values[i];
    if (v == null) continue;
    out.push({ ts: buckets[i]!, value: v });
  }
  return out;
}