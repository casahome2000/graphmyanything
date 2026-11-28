import type { DataPoint } from "./lttb.js";
import { computeSummary } from "./summary.js";
import { generateInsight, type InsightResult } from "./insight.js";
import {
  alignBucketedSeries,
  alignedToDataPoints,
  timeBucketForSpan,
} from "./time-buckets.js";

export type MultiSeriesInsightInput = {
  name: string;
  label: string;
  points: DataPoint[];
};

export type MultiSeriesInsightResult = InsightResult & {
  metrics: string[];
  per_series: Record<
    string,
    {
      label: string;
      latest: number | null;
      pct_change: number | null;
      trend: string;
      summary_line: string;
    }
  >;
  comparison?: {
    fastest_growth: string | null;
    slowest_growth: string | null;
    rank_by_latest: string[];
    rank_by_mean: string[];
    share_of_combined_latest_pct: Record<string, number>;
  };
  correlation?: {
    pairs: {
      a: string;
      b: string;
      pearson: number;
      point_count: number;
    }[];
    caveat: string;
  };
  divergences?: { ts: number; metric: string; direction: "up" | "down"; note: string }[];
  multi_metric?: boolean;
};

function pearson(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 3) return null;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i]!;
    sumB += b[i]!;
  }
  const meanA = sumA / n;
  const meanB = sumB / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i]! - meanA;
    const db = b[i]! - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  if (den === 0) return null;
  return Math.round((num / den) * 1000) / 1000;
}

export function generateMultiSeriesInsight(
  rangeLabel: string,
  series: MultiSeriesInsightInput[],
): MultiSeriesInsightResult {
  if (series.length === 1) {
    const single = generateInsight(series[0]!.name, series[0]!.points, rangeLabel);
    return {
      ...single,
      metrics: [series[0]!.name],
      per_series: {
        [series[0]!.name]: {
          label: series[0]!.label,
          latest: single.stats.latest,
          pct_change: single.stats.pct_change,
          trend: single.trend,
          summary_line: single.trend,
        },
      },
    };
  }

  const byMetric: Record<string, DataPoint[]> = {};
  for (const s of series) {
    byMetric[s.name] = s.points;
  }
  const allTs = series.flatMap((s) => s.points.map((p) => p.ts));
  const span = allTs.length ? Math.max(...allTs) - Math.min(...allTs) : 0;
  const aligned = alignBucketedSeries(byMetric, span);

  const per_series: MultiSeriesInsightResult["per_series"] = {};
  for (const s of series) {
    const alignedPts = alignedToDataPoints(
      aligned.buckets,
      aligned.byName[s.name] ?? [],
    );
    const stats = computeSummary(alignedPts.length ? alignedPts : s.points);
    let summary_line = `Latest ${stats.latest ?? "—"}, ${stats.pct_change ?? 0}% over ${rangeLabel}.`;
    if (stats.trend === "up") summary_line = `Up over ${rangeLabel}: latest ${stats.latest}, ${stats.pct_change}% vs start.`;
    else if (stats.trend === "down") {
      summary_line = `Down over ${rangeLabel}: latest ${stats.latest}, ${stats.pct_change}% vs start.`;
    }
    per_series[s.name] = {
      label: s.label,
      latest: stats.latest,
      pct_change: stats.pct_change,
      trend: stats.trend,
      summary_line,
    };
  }

  const growth = [...series]
    .map((s) => ({
      name: s.name,
      pct: per_series[s.name]?.pct_change ?? -Infinity,
    }))
    .filter((x) => x.pct != null && Number.isFinite(x.pct))
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));

  const rank_by_latest = [...series]
    .map((s) => ({ name: s.name, latest: per_series[s.name]?.latest ?? -Infinity }))
    .sort((a, b) => (b.latest ?? 0) - (a.latest ?? 0))
    .map((x) => x.name);

  const rank_by_mean = [...series]
    .map((s) => {
      const pts = alignedToDataPoints(aligned.buckets, aligned.byName[s.name] ?? []);
      const stats = computeSummary(pts);
      return { name: s.name, mean: stats.mean ?? -Infinity };
    })
    .sort((a, b) => (b.mean ?? 0) - (a.mean ?? 0))
    .map((x) => x.name);

  const latestSum = rank_by_latest.reduce((acc, name) => {
    const v = per_series[name]?.latest ?? 0;
    return acc + (v ?? 0);
  }, 0);
  const share: Record<string, number> = {};
  if (latestSum > 0) {
    for (const name of rank_by_latest) {
      const v = per_series[name]?.latest ?? 0;
      share[name] = Math.round(((v ?? 0) / latestSum) * 1000) / 10;
    }
  }

  const pairs: NonNullable<MultiSeriesInsightResult["correlation"]>["pairs"] = [];
  for (let i = 0; i < series.length; i++) {
    for (let j = i + 1; j < series.length; j++) {
      const aName = series[i]!.name;
      const bName = series[j]!.name;
      const overlap: { a: number; b: number }[] = [];
      const aVals = aligned.byName[aName] ?? [];
      const bVals = aligned.byName[bName] ?? [];
      for (let k = 0; k < aligned.buckets.length; k++) {
        const av = aVals[k];
        const bv = bVals[k];
        if (av != null && bv != null) overlap.push({ a: av, b: bv });
      }
      const r = pearson(
        overlap.map((o) => o.a),
        overlap.map((o) => o.b),
      );
      if (r != null) {
        pairs.push({ a: aName, b: bName, pearson: r, point_count: overlap.length });
      }
    }
  }

  const divergences: NonNullable<MultiSeriesInsightResult["divergences"]> = [];
  if (aligned.buckets.length >= 3) {
    for (let i = 1; i < aligned.buckets.length; i++) {
      const prev = i - 1;
      const moves: { name: string; delta: number }[] = [];
      for (const s of series) {
        const vals = aligned.byName[s.name] ?? [];
        const a = vals[prev];
        const b = vals[i];
        if (a == null || b == null) continue;
        const delta = b - a;
        if (Math.abs(delta) > 1e-9) moves.push({ name: s.name, delta });
      }
      if (moves.length === 1 && series.length > 1) {
        const m = moves[0]!;
        divergences.push({
          ts: aligned.buckets[i]!,
          metric: m.name,
          direction: m.delta > 0 ? "up" : "down",
          note: `${m.name} moved while other series held steady in ${timeBucketForSpan(span)} bucket ${i}.`,
        });
      }
    }
  }

  const primary = series[0]!;
  const baseInsight = generateInsight(primary.name, primary.points, rangeLabel);

  const comparisonLines = [
    growth[0]
      ? `Fastest growth: ${growth[0].name} (${growth[0].pct}%).`
      : null,
    rank_by_latest.length
      ? `Ranked by latest: ${rank_by_latest.join(" > ")}.`
      : null,
  ].filter(Boolean);

  const corrLine =
    pairs.length > 0
      ? `Correlation on shared ${aligned.bucket} buckets: ${pairs
          .map((p) => `${p.a}↔${p.b} r=${p.pearson}`)
          .join("; ")}.`
      : "Not enough overlapping bucket points for correlation.";

  const summary = [
    `Comparing ${series.length} metrics over ${rangeLabel}.`,
    ...comparisonLines,
    corrLine,
    pairs.length
      ? "Correlation does not imply causation."
      : null,
    divergences.length
      ? `${divergences.length} divergence bucket(s) where one series moved alone.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ...baseInsight,
    summary,
    metrics: series.map((s) => s.name),
    per_series,
    comparison: {
      fastest_growth: growth[0]?.name ?? null,
      slowest_growth: growth[growth.length - 1]?.name ?? null,
      rank_by_latest,
      rank_by_mean,
      share_of_combined_latest_pct: share,
    },
    correlation: {
      pairs,
      caveat: "Correlation does not imply causation.",
    },
    divergences: divergences.slice(0, 5),
    multi_metric: true,
  };
}