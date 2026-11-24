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

/**
 * Reproduce npm 0.2.3 / facts.json benchmark token counts (lean 288, …).
 * Charts resolve to `/tmp/charts/stripe.mrr-<ms>.svg` when the DB path is under
 * `/tmp` (same layout as the cloud-agent env that produced v0.2.3 facts).
 */
export const PUBLISHED_BENCH_DB_PATH = "/tmp/gma-no-db-bun-12136.db";
/** `writeChartFile` suffix from the v0.2.3 measurement run (`Date.now()` ms). */
export const PUBLISHED_BENCH_CHART_MS = 1_795_493_807_233;
/** Wall-clock seconds paired with PUBLISHED_BENCH_CHART_MS (v0.2.3 benchmark series). */
export const PUBLISHED_BENCH_SERIES_NOW = Math.floor(PUBLISHED_BENCH_CHART_MS / 1_000);

export function buildGmaPayloads(series: { ts: number; value: number }[]): GmaPayloadSet {
  const prevChartsDir = process.env.GRAPHMYANYTHING_CHARTS_DIR;
  const prevDbPath = process.env.GRAPHMYANYTHING_DB_PATH;
  delete process.env.GRAPHMYANYTHING_CHARTS_DIR;
  process.env.GRAPHMYANYTHING_DB_PATH = PUBLISHED_BENCH_DB_PATH;

  const dbPath = PUBLISHED_BENCH_DB_PATH;
  const dateNow = Date.now;
  Date.now = () => PUBLISHED_BENCH_CHART_MS;
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