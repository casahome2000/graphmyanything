import fs from "node:fs";
import path from "node:path";
import { openDatabase, insertPoints } from "../../packages/mcp-server/src/db.js";
import { handleChart, handleQuery } from "../../packages/mcp-server/src/tools/handlers.js";

export type GmaPayloadSet = {
  leanQuery: string;
  fullQuery: string;
  /** Default hosted chart (share url only). */
  chart: string;
  /** Same flow with include_embed: true. */
  chartWithEmbed: string;
};

/** Stable paths/timestamps so o200k counts match across CI and dev machines. */
const BENCH_CHARTS_DIR = "/var/tmp/gma-benchmark/charts";
const BENCH_DB_PATH = "/var/tmp/gma-benchmark/bench.sqlite";
const BENCH_CHART_MS = 1_700_000_000_000;

export function buildGmaPayloads(series: { ts: number; value: number }[]): GmaPayloadSet {
  const prevChartsDir = process.env.GRAPHMYANYTHING_CHARTS_DIR;
  const prevDbPath = process.env.GRAPHMYANYTHING_DB_PATH;
  process.env.GRAPHMYANYTHING_CHARTS_DIR = BENCH_CHARTS_DIR;
  process.env.GRAPHMYANYTHING_DB_PATH = BENCH_DB_PATH;

  const dbPath = BENCH_DB_PATH;
  const dateNow = Date.now;
  Date.now = () => BENCH_CHART_MS;
  const db = openDatabase(dbPath);
  insertPoints(
    db,
    "stripe.mrr",
    series.map((p) => ({ ...p, tags: {} })),
  );

  const leanQuery = JSON.stringify(
    handleQuery(db, {
      metric: "stripe.mrr",
      range: "90d",
      token_budget: 250,
      points: "auto",
      also_chart: true,
    }),
  );
  const fullQuery = JSON.stringify(
    handleQuery(db, {
      metric: "stripe.mrr",
      range: "90d",
      token_budget: 500,
      points: 50,
      also_chart: false,
    }),
  );

  const localChart = handleChart(db, {
    metric: "stripe.mrr",
    range: "90d",
    type: "area",
    theme: "dark",
  });
  const shareUrl = "https://graphmyanything.com/c/a1b2c3d4e5f6789012345678";
  const chartJson = JSON.stringify({
    path: localChart.path,
    url: shareUrl,
    tokens_estimate: localChart.tokens_estimate,
  });
  const chartWithEmbed = JSON.stringify({
    path: localChart.path,
    url: shareUrl,
    embed_svg: `${shareUrl}/svg`,
    embed_png: `${shareUrl}/png`,
    tokens_estimate: localChart.tokens_estimate + 8,
  });

  db.close();
  try {
    fs.unlinkSync(dbPath);
  } catch {
    /* ok */
  }

  Date.now = dateNow;
  if (prevChartsDir === undefined) delete process.env.GRAPHMYANYTHING_CHARTS_DIR;
  else process.env.GRAPHMYANYTHING_CHARTS_DIR = prevChartsDir;
  if (prevDbPath === undefined) delete process.env.GRAPHMYANYTHING_DB_PATH;
  else process.env.GRAPHMYANYTHING_DB_PATH = prevDbPath;

  return { leanQuery, fullQuery, chart: chartJson, chartWithEmbed };
}