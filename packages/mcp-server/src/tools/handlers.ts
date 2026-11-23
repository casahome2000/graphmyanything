import {
  deletePoints,
  queryPoints,
  upsertPoints,
  type GmaDatabase,
  type MetricPoint,
} from "../db.js";
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
  type ChartLabelsMode,
  type ChartType,
  type ChartTheme,
} from "../lib/svg-chart.js";
import { HOSTED_CHART_URL_NOTE } from "../paths.js";
import { estimateTokens, withTokensEstimate } from "../lib/tokens.js";

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

export function handleForget(
  db: GmaDatabase,
  args: {
    metric: string;
    ts?: number;
    from?: number;
    to?: number;
    all?: boolean;
    confirm?: boolean;
  },
): { ok: true; metric: string; deleted: number } {
  const metric = args.metric.trim();
  if (!metric) throw new Error("metric is required");

  if (args.all) {
    if (args.confirm !== true) {
      throw new Error("all:true requires confirm:true");
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
    throw new Error("Specify ts, from+to, or all:true");
  }

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

  const base: Omit<Payload, "tokens_estimate"> = {
    m: metric,
    rg: args.range ?? "all",
    s: terseSummary(summary),
  };

  let payload: Payload = { ...base, tokens_estimate: 0 };
  if (seriesPlan.mode === "lttb" && points.length > 0) {
    payload.pts = lttb(points, seriesPlan.maxPoints);
  }

  const finalize = (p: Payload): Payload => {
    const { tokens_estimate: _drop, ...rest } = p;
    const out = { ...rest, tokens_estimate: 0 } as Payload;
    out.tokens_estimate = estimateTokens(out);
    return out;
  };

  payload = finalize(payload);

  if (
    payload.pts &&
    payload.pts.length > 10 &&
    payload.tokens_estimate > tokenBudget
  ) {
    let n = payload.pts.length;
    while (n > 5) {
      n = Math.floor(n * 0.7);
      payload = finalize({ ...base, pts: lttb(points, n), tokens_estimate: 0 });
      if (payload.tokens_estimate <= tokenBudget) break;
    }
  }

  let json = JSON.stringify(payload);
  json = fitTokenBudget(json, tokenBudget);
  const parsed = JSON.parse(json) as Payload;
  if (typeof parsed.tokens_estimate !== "number" || parsed.tokens_estimate < 1) {
    parsed.tokens_estimate = Math.max(1, estimateTokens(parsed));
  }
  return parsed as Record<string, unknown>;
}

export function handleInsight(
  db: GmaDatabase,
  args: { metric: string; range?: string },
): ReturnType<typeof generateInsight> & { tokens_estimate: number } {
  const metric = args.metric.trim();
  const rangeLabel = args.range ?? "all";
  const { fromTs, toTs } = parseRange(args.range);
  const rows = queryPoints(db, metric, fromTs, toTs);
  const points: DataPoint[] = rows.map((r) => ({ ts: r.ts, value: r.value }));
  return withTokensEstimate(generateInsight(metric, points, rangeLabel));
}

export function handleChart(
  db: GmaDatabase,
  args: {
    metric: string;
    range?: string;
    type?: ChartType;
    theme?: ChartTheme;
    labels?: ChartLabelsMode;
  },
): {
  path: string;
  url: null;
  hosted_url_note: string;
  tokens_estimate: number;
} {
  const metric = args.metric.trim();
  const type = args.type ?? "line";
  const theme = args.theme ?? "dark";
  const { fromTs, toTs } = parseRange(args.range);
  const rows = queryPoints(db, metric, fromTs, toTs);
  const points: DataPoint[] = rows.map((r) => ({ ts: r.ts, value: r.value }));
  const display =
    points.length <= 500
      ? points
      : lttb(points, 500);
  const labels = args.labels ?? "last";
  const svg = renderSvgChart(metric, display, type, theme, labels);
  const filePath = writeChartFile(metric, svg);
  return withTokensEstimate({
    path: filePath,
    url: null as null,
    hosted_url_note: HOSTED_CHART_URL_NOTE,
  });
}