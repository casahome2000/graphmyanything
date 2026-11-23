import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { MetricSeries } from "../metrics.js";

const DEFAULT_DIR = path.join(os.homedir(), ".graphmyanything");
const DEFAULT_DB = path.join(DEFAULT_DIR, "metrics.db");

export function resolveDbPath(): string {
  return process.env.GRAPHMYANYTHING_DB_PATH ?? DEFAULT_DB;
}

export function openMetricsDb(dbPath = resolveDbPath()): DatabaseSync {
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS metric_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL,
      ts INTEGER NOT NULL,
      value REAL NOT NULL,
      tags TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_metric_ts_unique ON metric_points(metric, ts);
    CREATE INDEX IF NOT EXISTS idx_metric_ts ON metric_points(metric, ts);
  `);
  return db;
}

export type UpsertBatchResult = { written: number; replaced: number };

/** Same upsert semantics as graphmyanything-mcp `track` (metric + ts). */
export function upsertMetricSeries(
  db: DatabaseSync,
  series: MetricSeries[],
): UpsertBatchResult {
  const existsStmt = db.prepare(
    `SELECT 1 FROM metric_points WHERE metric = ? AND ts = ? LIMIT 1`,
  );
  const upsertStmt = db.prepare(`
    INSERT INTO metric_points (metric, ts, value, tags)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(metric, ts) DO UPDATE SET
      value = excluded.value,
      tags = excluded.tags,
      created_at = unixepoch()
  `);

  let written = 0;
  let replaced = 0;
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const { metric, points } of series) {
      for (const p of points) {
        const tags = JSON.stringify(p.tags ?? {});
        const had = existsStmt.get(metric, p.ts);
        upsertStmt.run(metric, p.ts, p.value, tags);
        if (had) replaced += 1;
        else written += 1;
      }
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return { written, replaced };
}

/**
 * Hosted upload. When GRAPHMYANYTHING_API_KEY is set (the key `graphmyanything-mcp sync`
 * saves, or one from the account page), also upsert the series to the hosted API
 * via POST {base}/track/batch so live chart links update. Base defaults to
 * https://graphmyanything.com/api/v1 (override: GRAPHMYANYTHING_API_BASE).
 */
export async function pushHostedTrackHook(
  series: MetricSeries[],
): Promise<{ written: number; replaced: number } | null> {
  const key = process.env.GRAPHMYANYTHING_API_KEY?.trim();
  if (!key) return null;
  const base = (
    process.env.GRAPHMYANYTHING_API_BASE?.trim() || "https://graphmyanything.com/api/v1"
  ).replace(/\/$/, "");

  const points = series.flatMap((s) =>
    s.points.map((p) => ({ metric: s.metric, ts: p.ts, value: p.value, tags: p.tags })),
  );
  let written = 0;
  let replaced = 0;
  for (let i = 0; i < points.length; i += 5000) {
    const res = await fetch(`${base}/track/batch`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "x-gma-client": "graphmyanything-stripe",
      },
      body: JSON.stringify({ points: points.slice(i, i + 5000) }),
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        msg = (JSON.parse(text) as { error?: string }).error ?? msg;
      } catch {
        /* keep status */
      }
      throw new Error(`Hosted upload failed: ${msg}`);
    }
    const body = JSON.parse(text) as { written?: number; replaced?: number };
    written += body.written ?? 0;
    replaced += body.replaced ?? 0;
  }
  return { written, replaced };
}
