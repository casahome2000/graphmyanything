import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { openDatabase, insertPoints } from "../../packages/mcp-server/src/db.js";
import { handleChart, handleQuery } from "../../packages/mcp-server/src/tools/handlers.js";

export type GmaPayloadSet = {
  leanQuery: string;
  fullQuery: string;
  chart: string;
};

export function buildGmaPayloads(series: { ts: number; value: number }[]): GmaPayloadSet {
  const dbPath = path.join(
    os.tmpdir(),
    `gma-bench-${process.pid}-${Date.now()}.db`,
  );
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

  const chartPath = path.join(os.tmpdir(), "gma-bench-chart.svg");
  const chartJson = JSON.stringify(
    handleChart(db, {
      metric: "stripe.mrr",
      range: "90d",
      type: "area",
      theme: "dark",
    }),
  );

  db.close();
  try {
    fs.unlinkSync(dbPath);
  } catch {
    /* ok */
  }

  return { leanQuery, fullQuery, chart: chartJson };
}