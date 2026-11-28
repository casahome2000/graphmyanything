import {
  deletePoints,
  queryPoints,
  upsertPoints,
  type GmaDatabase,
  type MetricPoint,
} from "../db.js";
import { buildQueryPayload, parseRange } from "../vendor/core/query.js";
import { generateInsight } from "../lib/insight.js";
import { lttb, type DataPoint } from "../lib/lttb.js";
import {
  renderSvgChart,
  writeChartFile,
  type ChartLabelsMode,
  type ChartType,
  type ChartTheme,
} from "../lib/svg-chart.js";
import { renderSvgMultiSeriesChart } from "../lib/svg-chart-multi.js";
import type { ChartSeriesRenderInput } from "../lib/svg-chart-multi.js";
import { generateMultiSeriesInsight } from "../lib/multi-series-insight.js";
import {
  buildAlignedChartSeries,
  buildInsightSeriesInputs,
  chartTitleFromSeries,
  loadSeriesPoints,
} from "../lib/chart-series.js";
import {
  resolveSeriesFromToolArgs,
  safeChartFileStem,
  type SeriesInput,
} from "../lib/multi-metric.js";
import { HOSTED_CHART_URL_NOTE } from "../paths.js";
import { withTokensEstimate } from "../lib/tokens.js";

export type InsightToolArgs = {
  metric?: string;
  metrics?: string[];
  series?: SeriesInput[];
  range?: string;
};

export type ChartToolArgs = {
  metric?: string;
  metrics?: string[];
  series?: SeriesInput[];
  range?: string;
  type?: ChartType;
  theme?: ChartTheme;
  labels?: ChartLabelsMode;
  share?: boolean;
};

function normalizeTags(tags?: Record<string, string>): Record<string, string> {
  return tags ?? {};
}

export function handleTrack(
  db: GmaDatabase,
  args: {
    metric: string;
    value?: number;
    points?: { value: number; ts?: number; tags?: Record<string, string> }[];
    tags?: Record<string, string>;
  },
): { ok: true; metric: string; written: number; replaced: number } {
  const now = Math.floor(Date.now() / 1000);
  const metric = args.metric.trim();
  if (!metric) throw new Error("metric is required");

  let toInsert: MetricPoint[] = [];
  if (args.points && args.points.length > 0) {
    toInsert = args.points.map((p) => ({
      ts: p.ts ?? now,
      value: p.value,
      tags: { ...normalizeTags(args.tags), ...normalizeTags(p.tags) },
    }));
  } else if (args.value != null) {
    toInsert = [
      {
        ts: now,
        value: args.value,
        tags: normalizeTags(args.tags),
      },
    ];
  } else {
    throw new Error("Provide value or points[]");
  }

  const { written, replaced } = upsertPoints(db, metric, toInsert);
  return withTokensEstimate({ ok: true as const, metric, written, replaced });
}

export type ForgetArgs = {
  metric: string;
  ts?: number;
  from?: number;
  to?: number;
  all?: boolean;
  confirm?: boolean;
};

export function validateForgetArgs(args: ForgetArgs): string {
  const metric = args.metric.trim();
  if (!metric) throw new Error("metric is required");

  if (args.all) {
    if (args.confirm !== true) {
      throw new Error(
        "Deleting all points for a metric requires confirm:true — call forget with { metric, all: true, confirm: true } only.",
      );
    }
    if (
      args.ts != null ||
      args.from != null ||
      args.to != null
    ) {
      throw new Error("Use all:true alone for whole-metric delete");
    }
  } else if (args.ts != null) {
    if (args.from != null || args.to != null || args.all) {
      throw new Error("Use ts alone for a single-point delete");
    }
  } else if (args.from != null || args.to != null) {
    if (args.from == null || args.to == null) {
      throw new Error("Range delete requires both from and to (Unix seconds)");
    }
    if (args.ts != null || args.all) {
      throw new Error("Use from+to alone for range delete");
    }
  } else {
    throw new Error(
      "Specify ts, from+to, or all:true with confirm:true for whole-metric delete",
    );
  }
  return metric;
}

export function handleForget(
  db: GmaDatabase,
  args: ForgetArgs,
): { ok: true; metric: string; deleted: number } {
  const metric = validateForgetArgs(args);

  const deleted = deletePoints(db, {
    metric,
    ts: args.ts,
    from: args.from,
    to: args.to,
    all: args.all,
  });
  return withTokensEstimate({ ok: true as const, metric, deleted });
}

const DEFAULT_LTTB = 50;

export function handleQuery(
  db: GmaDatabase,
  args: {
    metric: string;
    range?: string;
    token_budget?: number;
    points?: import("../lib/terse-summary.js").PointsArg;
    /** Hint that a chart tool call follows — used by points=auto. */
    also_chart?: boolean;
  },
): Record<string, unknown> {
  const metric = args.metric.trim();
  const { fromTs, toTs } = parseRange(args.range);
  const rows = queryPoints(db, metric, fromTs, toTs);
  const points: DataPoint[] = rows.map((r) => ({ ts: r.ts, value: r.value }));
  return buildQueryPayload(metric, points, args);
}

function renderChartSvg(
  title: string,
  series: ChartSeriesRenderInput[],
  args: Pick<ChartToolArgs, "type" | "theme" | "labels">,
): string {
  const type = args.type ?? "line";
  const theme = args.theme ?? "dark";
  const labels = args.labels ?? "last";
  if (series.length > 1) {
    return renderSvgMultiSeriesChart(title, series, type, theme, labels);
  }
  const first = series[0];
  return renderSvgChart(
    first?.label ?? title,
    first?.points ?? [],
    type,
    theme,
    labels,
  );
}

export function handleInsight(
  db: GmaDatabase,
  args: InsightToolArgs,
): ReturnType<typeof generateInsight> & { tokens_estimate: number } {
  const rangeLabel = args.range ?? "all";
  const series = resolveSeriesFromToolArgs(args);
  if (series.length === 1) {
    const metric = series[0]!.name;
    const { fromTs, toTs } = parseRange(args.range);
    const rows = queryPoints(db, metric, fromTs, toTs);
    const points: DataPoint[] = rows.map((r) => ({ ts: r.ts, value: r.value }));
    return withTokensEstimate(generateInsight(metric, points, rangeLabel));
  }

  const byMetric = loadSeriesPoints(db, series, args.range);
  const insightSeries = buildInsightSeriesInputs(series, byMetric, args.range);
  return withTokensEstimate(
    generateMultiSeriesInsight(rangeLabel, insightSeries),
  );
}

export function handleChart(
  db: GmaDatabase,
  args: ChartToolArgs,
): {
  path: string;
  url: null;
  hosted_url_note: string;
  tokens_estimate: number;
} {
  const series = resolveSeriesFromToolArgs(args);
  const theme = args.theme ?? "dark";
  const byMetric = loadSeriesPoints(db, series, args.range);
  const title = chartTitleFromSeries(series);
  const aligned = buildAlignedChartSeries(series, byMetric, args.range, theme);
  const svg = renderChartSvg(title, aligned, args);
  const filePath = writeChartFile(safeChartFileStem(series), svg);
  return withTokensEstimate({
    path: filePath,
    url: null as null,
    hosted_url_note: HOSTED_CHART_URL_NOTE,
  });
}