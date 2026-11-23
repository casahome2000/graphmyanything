import { METRIC } from "../../metrics.js";
import { openMetricsDb, resolveDbPath } from "../metrics-store.js";
import { loadState, resolveStatePath } from "../state.js";

export function runStatus(): void {
  const state = loadState();
  const db = openMetricsDb();

  const metrics = [
    METRIC.subscribers(),
    METRIC.mrr("usd"),
    METRIC.mrrNew("usd"),
    METRIC.mrrChurned("usd"),
    METRIC.revenueNet("usd"),
  ];

  const counts: Record<string, number> = {};
  for (const m of metrics) {
    const row = db
      .prepare(`SELECT COUNT(*) AS n FROM metric_points WHERE metric = ?`)
      .get(m) as { n: number };
    counts[m] = row.n;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        command: "status",
        dbPath: resolveDbPath(),
        statePath: resolveStatePath(),
        state,
        pointCounts: counts,
      },
      null,
      2,
    ),
  );
}