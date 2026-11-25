/**
 * Example tool arguments documented in docs/examples.md — validated in example-args.test.ts.
 */
import {
  GITHUB_STARS_CURRENT,
  GITHUB_STARS_METRIC,
  githubStarsBackfill14,
} from "./demo-github-stars.js";

export type DocExample = {
  id: string;
  tool: "track" | "query" | "insight" | "chart" | "forget";
  arguments: Record<string, unknown>;
};

const starsBackfill = githubStarsBackfill14();
const correctionTs = starsBackfill[starsBackfill.length - 2]!.ts;
const forgetTs = starsBackfill[starsBackfill.length - 3]!.ts;

export const DOC_EXAMPLE_TOOL_CALLS: DocExample[] = [
  {
    id: "github-stars-backfill",
    tool: "track",
    arguments: {
      metric: GITHUB_STARS_METRIC,
      points: starsBackfill,
      tags: { source: "github", repo: "modelcontextprotocol/servers" },
    },
  },
  {
    id: "github-stars-daily",
    tool: "track",
    arguments: {
      metric: GITHUB_STARS_METRIC,
      value: GITHUB_STARS_CURRENT,
      tags: { source: "github" },
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
    id: "github-stars-insight",
    tool: "insight",
    arguments: {
      metric: GITHUB_STARS_METRIC,
      range: "14d",
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
    id: "github-stars-query",
    tool: "query",
    arguments: {
      metric: GITHUB_STARS_METRIC,
      range: "14d",
      token_budget: 250,
      points: 12,
    },
  },
  {
    id: "github-stars-correction",
    tool: "track",
    arguments: {
      metric: GITHUB_STARS_METRIC,
      points: [{ ts: correctionTs, value: 91_870 }],
      tags: { note: "corrected API snapshot" },
    },
  },
  {
    id: "forget-point",
    tool: "forget",
    arguments: {
      metric: GITHUB_STARS_METRIC,
      ts: forgetTs,
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