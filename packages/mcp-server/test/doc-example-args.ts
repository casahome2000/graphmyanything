/**
 * Example tool arguments documented in docs/examples.md — validated in example-args.test.ts.
 */
export type DocExample = {
  id: string;
  tool: "track" | "query" | "insight" | "chart" | "forget";
  arguments: Record<string, unknown>;
};

export const DOC_EXAMPLE_TOOL_CALLS: DocExample[] = [
  {
    id: "daily-weight",
    tool: "track",
    arguments: {
      metric: "health.weight.lb",
      value: 182.4,
      tags: { source: "scale" },
    },
  },
  {
    id: "plano-population-backfill",
    tool: "track",
    arguments: {
      metric: "geo.plano_tx.population",
      points: [
        { ts: 946684800, value: 188614 },
        { ts: 1262304000, value: 259841 },
        { ts: 1577836800, value: 285494 },
      ],
      tags: { source: "census" },
    },
  },
  {
    id: "plano-population-query",
    tool: "query",
    arguments: {
      metric: "geo.plano_tx.population",
      range: "all",
      token_budget: 200,
      points: 0,
    },
  },
  {
    id: "stripe-mrr-track",
    tool: "track",
    arguments: {
      metric: "stripe.mrr.usd",
      value: 84210,
      tags: { plan: "mixed", source: "n8n" },
    },
  },
  {
    id: "stripe-mrr-query-insight-flow",
    tool: "query",
    arguments: {
      metric: "stripe.mrr.usd",
      range: "90d",
      token_budget: 300,
      also_chart: true,
      points: "auto",
    },
  },
  {
    id: "weight-trend-insight",
    tool: "insight",
    arguments: {
      metric: "health.weight.lb",
      range: "90d",
    },
  },
  {
    id: "population-chart-labels",
    tool: "chart",
    arguments: {
      metric: "geo.plano_tx.population",
      range: "30y",
      type: "area",
      theme: "dark",
      labels: "extremes",
    },
  },
  {
    id: "weight-range-query",
    tool: "query",
    arguments: {
      metric: "health.weight.lb",
      range: "7d",
      token_budget: 250,
      points: 12,
    },
  },
  {
    id: "weight-correction-upsert",
    tool: "track",
    arguments: {
      metric: "health.weight.lb",
      points: [{ ts: 1732147200, value: 181.9 }],
      tags: { note: "corrected misread" },
    },
  },
  {
    id: "forget-point",
    tool: "forget",
    arguments: {
      metric: "health.weight.lb",
      ts: 1731888000,
    },
  },
  {
    id: "multi-metric-stripe-chart",
    tool: "chart",
    arguments: {
      metric: "stripe.mrr.usd",
      range: "90d",
      type: "line",
      theme: "light",
      labels: "last",
    },
  },
];