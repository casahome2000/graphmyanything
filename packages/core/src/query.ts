import { lttb, type DataPoint } from "./lttb.js";
import { computeSummary, fitTokenBudget, parseRange } from "./summary.js";
import {
  resolveIncludeSeries,
  terseSummary,
  type PointsArg,
} from "./terse-summary.js";
import { estimateTokens } from "./tokens.js";

export type QueryPayload = {
  m: string;
  rg: string;
  s: Record<string, number | string | null>;
  pts?: DataPoint[];
  tokens_estimate: number;
};

export function buildQueryPayload(
  metric: string,
  points: DataPoint[],
  args: {
    range?: string;
    token_budget?: number;
    points?: PointsArg;
    also_chart?: boolean;
  },
): Record<string, unknown> {
  const tokenBudget = args.token_budget ?? 500;
  const summary = computeSummary(points);
  const seriesPlan = resolveIncludeSeries(
    args.points,
    tokenBudget,
    args.also_chart,
  );

  const base: Omit<QueryPayload, "tokens_estimate"> = {
    m: metric,
    rg: args.range ?? "all",
    s: terseSummary(summary),
  };

  let payload: QueryPayload = { ...base, tokens_estimate: 0 };
  if (seriesPlan.mode === "lttb" && points.length > 0) {
    payload.pts = lttb(points, seriesPlan.maxPoints);
  }

  const finalize = (p: QueryPayload): QueryPayload => {
    const { tokens_estimate: _drop, ...rest } = p;
    const out = { ...rest, tokens_estimate: 0 } as QueryPayload;
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
  const parsed = JSON.parse(json) as QueryPayload;
  if (typeof parsed.tokens_estimate !== "number" || parsed.tokens_estimate < 1) {
    parsed.tokens_estimate = Math.max(1, estimateTokens(parsed));
  }
  return parsed as Record<string, unknown>;
}

export { parseRange };