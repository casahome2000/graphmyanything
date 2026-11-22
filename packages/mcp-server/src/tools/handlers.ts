import { insertPoints, queryPoints, type GmaDatabase, type MetricPoint } from "../db.js";
import { generateInsight } from "../lib/insight.js";
import { lttb, type DataPoint } from "../lib/lttb.js";
import {
  computeSummary,
  fitTokenBudget,
  parseRange,
} from "../lib/summary.js";
import {
  resolveIncludeSeries,
  terseSummary,
  type PointsArg,
} from "../lib/terse-summary.js";
import {
  renderSvgChart,
  writeChartFile,
  type ChartType,
  type ChartTheme,
} from "../lib/svg-chart.js";

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
): { ok: true; metric: string; written: number } {
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

  const written = insertPoints(db, metric, toInsert);
  return { ok: true, metric, written };
}

const DEFAULT_LTTB = 50;

export function handleQuery(
  db: GmaDatabase,
  args: {
    metric: string;
    range?: string;
    token_budget?: number;
    points?: PointsArg;
    /** Hint that a chart tool call follows — used by points=auto. */
    also_chart?: boolean;
  },
): Record<string, unknown> {
  const metric = args.metric.trim();
  const tokenBudget = args.token_budget ?? 500;
  const { fromTs, toTs } = parseRange(args.range);
  const rows = queryPoints(db, metric, fromTs, toTs);
  const points: DataPoint[] = rows.map((r) => ({ ts: r.ts, value: r.value }));
  const summary = computeSummary(points);
  const seriesPlan = resolveIncludeSeries(
    args.points,
    tokenBudget,
    args.also_chart,
  );

  type Payload = {
    m: string;
    rg: string;
    s: Record<string, number | string | null>;
    pts?: DataPoint[];
    tokens_estimate: number;
  };

  const base: Payload = {
    m: metric,
    rg: args.range ?? "all",
    s: terseSummary(summary),
    tokens_estimate: 0,
  };

  let payload: Payload = { ...base };
  if (seriesPlan.mode === "lttb" && points.length > 0) {
    payload.pts = lttb(points, seriesPlan.maxPoints);
  }

  let json = JSON.stringify(payload);
  payload.tokens_estimate = Math.ceil(json.length / 4);

  if (
    payload.pts &&
    payload.pts.length > 10 &&
    payload.tokens_estimate > tokenBudget
  ) {
    let n = payload.pts.length;
    while (n > 5) {
      n = Math.floor(n * 0.7);
      payload = {
        ...base,
        pts: lttb(points, n),
        tokens_estimate: 0,
      };
      json = JSON.stringify(payload);
      payload.tokens_estimate = Math.ceil(json.length / 4);
      if (payload.tokens_estimate <= tokenBudget) break;
    }
  }

  json = fitTokenBudget(json, tokenBudget);
  return JSON.parse(json) as Record<string, unknown>;
}

export function handleInsight(
  db: GmaDatabase,
  args: { metric: string; range?: string },
): ReturnType<typeof generateInsight> {
  const metric = args.metric.trim();
  const rangeLabel = args.range ?? "all";
  const { fromTs, toTs } = parseRange(args.range);
  const rows = queryPoints(db, metric, fromTs, toTs);
  const points: DataPoint[] = rows.map((r) => ({ ts: r.ts, value: r.value }));
  return generateInsight(metric, points, rangeLabel);
}

export function handleChart(
  db: GmaDatabase,
  args: {
    metric: string;
    range?: string;
    type?: ChartType;
    theme?: ChartTheme;
  },
): {
  path: string;
  url: string;
} {
  const metric = args.metric.trim();
  const type = args.type ?? "line";
  const theme = args.theme ?? "dark";
  const { fromTs, toTs } = parseRange(args.range);
  const rows = queryPoints(db, metric, fromTs, toTs);
  const points: DataPoint[] = rows.map((r) => ({ ts: r.ts, value: r.value }));
  const display = lttb(points, Math.min(500, Math.max(50, points.length)));
  const svg = renderSvgChart(metric, display, type, theme);
  const filePath = writeChartFile(metric, svg);
  const slug = encodeURIComponent(metric);
  return {
    path: filePath,
    url: `https://graphmyanything.com/c/${slug}`,
  };
}