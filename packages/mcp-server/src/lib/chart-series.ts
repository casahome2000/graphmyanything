import type { GmaDatabase } from "../db.js";
import { queryPoints } from "../db.js";
import { lttb, type DataPoint } from "./lttb.js";
import { parseRange } from "./summary.js";
import {
  alignBucketedSeries,
  alignedToDataPoints,
} from "../vendor/core/time-buckets.js";
import { seriesColorAt } from "../vendor/core/chart-series-colors.js";
import type { ChartSeriesRenderInput } from "../vendor/core/svg-chart-multi.js";
import type { ChartTheme } from "./svg-chart.js";
import type { MultiSeriesInsightInput } from "../vendor/core/multi-series-insight.js";
import type { SeriesInput } from "./multi-metric.js";

function filterRowsByRange(
  rows: { ts: number; value: number }[],
  range?: string,
): { ts: number; value: number }[] {
  const { fromTs, toTs } = parseRange(range);
  return rows.filter((r) => {
    if (fromTs != null && r.ts < fromTs) return false;
    if (r.ts > toTs) return false;
    return true;
  });
}

export function loadSeriesPoints(
  db: GmaDatabase,
  series: SeriesInput[],
  range?: string,
): Record<string, DataPoint[]> {
  const { fromTs, toTs } = parseRange(range);
  const byMetric: Record<string, DataPoint[]> = {};
  for (const s of series) {
    const rows = queryPoints(db, s.name, fromTs, toTs);
    byMetric[s.name] = rows.map((r) => ({ ts: r.ts, value: r.value }));
  }
  return byMetric;
}

export function buildAlignedChartSeries(
  series: SeriesInput[],
  byMetric: Record<string, DataPoint[]>,
  range: string | undefined,
  theme: ChartTheme,
): ChartSeriesRenderInput[] {
  const filtered: Record<string, DataPoint[]> = {};
  for (const s of series) {
    filtered[s.name] = filterRowsByRange(byMetric[s.name] ?? [], range);
  }
  const allTs = Object.values(filtered).flatMap((rows) => rows.map((r) => r.ts));
  const span =
    allTs.length > 0 ? Math.max(...allTs) - Math.min(...allTs) : 0;
  const pointsByMetric: Record<string, DataPoint[]> = {};
  for (const [name, rows] of Object.entries(filtered)) {
    pointsByMetric[name] = rows;
  }
  const aligned = alignBucketedSeries(pointsByMetric, span);
  return series.map((s, i) => {
    const alignedPts = alignedToDataPoints(
      aligned.buckets,
      aligned.byName[s.name] ?? [],
    );
    const display =
      alignedPts.length <= 500 ? alignedPts : lttb(alignedPts, 500);
    return {
      label: s.label ?? s.name,
      color: seriesColorAt(i, s.color, theme),
      points: display,
    };
  });
}

export function chartTitleFromSeries(series: SeriesInput[]): string {
  if (series.length === 1) return series[0]!.name;
  return series.map((s) => s.label ?? s.name).join(" · ");
}

export function buildInsightSeriesInputs(
  series: SeriesInput[],
  byMetric: Record<string, DataPoint[]>,
  range: string | undefined,
): MultiSeriesInsightInput[] {
  return series.map((s) => ({
    name: s.name,
    label: s.label ?? s.name,
    points: filterRowsByRange(byMetric[s.name] ?? [], range),
  }));
}