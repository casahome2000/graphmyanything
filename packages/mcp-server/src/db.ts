import "./bootstrap.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_DIR = path.join(os.homedir(), ".graphmyanything");
const DEFAULT_DB = path.join(DEFAULT_DIR, "metrics.db");

export type GmaDatabase = DatabaseSync;

export function resolveDbPath(): string {
  return process.env.GRAPHMYANYTHING_DB_PATH ?? DEFAULT_DB;
}

const UNIQUE_INDEX = "idx_metric_ts_unique";

/** Dedupe (metric, ts) rows and add UNIQUE(metric, ts) — idempotent on fresh DBs. */
export function migrateUniqueMetricTs(db: GmaDatabase): void {
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?`,
    )
    .get(UNIQUE_INDEX) as { name: string } | undefined;
  if (row) return;

  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(`
      DELETE FROM metric_points
      WHERE id NOT IN (
        SELECT MAX(id) FROM metric_points GROUP BY metric, ts
      );
    `);
    db.exec(`
      CREATE UNIQUE INDEX ${UNIQUE_INDEX} ON metric_points(metric, ts);
    `);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function openDatabase(dbPath = resolveDbPath()): GmaDatabase {
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
    CREATE INDEX IF NOT EXISTS idx_metric_ts ON metric_points(metric, ts);
  `);
  migrateUniqueMetricTs(db);
  return db;
}

export type MetricPoint = {
  ts: number;
  value: number;
  tags: Record<string, string>;
};

export type UpsertResult = { written: number; replaced: number };

export function upsertPoints(
  db: GmaDatabase,
  metric: string,
  points: MetricPoint[],
): UpsertResult {
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
    for (const row of points) {
      const had = existsStmt.get(metric, row.ts);
      upsertStmt.run(metric, row.ts, row.value, JSON.stringify(row.tags ?? {}));
      if (had) replaced += 1;
      else written += 1;
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
  return { written, replaced };
}

/** @deprecated Use upsertPoints — kept for tests that only need rows present. */
export function insertPoints(
  db: GmaDatabase,
  metric: string,
  points: MetricPoint[],
): number {
  const { written, replaced } = upsertPoints(db, metric, points);
  return written + replaced;
}

export function deletePoints(
  db: GmaDatabase,
  args: {
    metric: string;
    ts?: number;
    from?: number;
    to?: number;
    all?: boolean;
  },
): number {
  const metric = args.metric.trim();
  if (!metric) throw new Error("metric is required");

  let sql = `DELETE FROM metric_points WHERE metric = ?`;
  const params: (string | number)[] = [metric];

  if (args.all) {
    // whole metric
  } else if (args.ts != null) {
    sql += ` AND ts = ?`;
    params.push(args.ts);
  } else if (args.from != null && args.to != null) {
    sql += ` AND ts >= ? AND ts <= ?`;
    params.push(args.from, args.to);
  } else {
    throw new Error(
      "Specify ts, from+to, or all:true (with confirm in the tool handler)",
    );
  }

  const result = db.prepare(sql).run(...params);
  return Number(result.changes);
}

export function queryPoints(
  db: GmaDatabase,
  metric: string,
  fromTs?: number,
  toTs?: number,
): { ts: number; value: number; tags: Record<string, string> }[] {
  let sql = `SELECT ts, value, tags FROM metric_points WHERE metric = ?`;
  const params: (string | number)[] = [metric];
  if (fromTs != null) {
    sql += ` AND ts >= ?`;
    params.push(fromTs);
  }
  if (toTs != null) {
    sql += ` AND ts <= ?`;
    params.push(toTs);
  }
  sql += ` ORDER BY ts ASC`;
  const rows = db.prepare(sql).all(...params) as {
    ts: number;
    value: number;
    tags: string;
  }[];
  return rows.map((r) => ({
    ts: r.ts,
    value: r.value,
    tags: JSON.parse(r.tags) as Record<string, string>,
  }));
}

export function countPoints(db: GmaDatabase, metric: string): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM metric_points WHERE metric = ?`)
    .get(metric) as { n: number };
  return row.n;
}

export type StoredPointRow = {
  id: number;
  metric: string;
  ts: number;
  value: number;
  tags: Record<string, string>;
};

/** Ordered by id for resumable sync uploads. */
export function listPointsAfterId(
  db: GmaDatabase,
  afterId: number,
  limit: number,
): StoredPointRow[] {
  const rows = db
    .prepare(
      `SELECT id, metric, ts, value, tags FROM metric_points
       WHERE id > ? ORDER BY id ASC LIMIT ?`,
    )
    .all(afterId, limit) as {
    id: number;
    metric: string;
    ts: number;
    value: number;
    tags: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    metric: r.metric,
    ts: r.ts,
    value: r.value,
    tags: JSON.parse(r.tags) as Record<string, string>,
  }));
}

export function totalPointCount(db: GmaDatabase): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM metric_points`).get() as {
    n: number;
  };
  return row.n;
}