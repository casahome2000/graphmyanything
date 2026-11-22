import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

const DEFAULT_DIR = path.join(os.homedir(), ".graphmyanything");
const DEFAULT_DB = path.join(DEFAULT_DIR, "metrics.db");

export function resolveDbPath(): string {
  return process.env.GRAPHMYANYTHING_DB_PATH ?? DEFAULT_DB;
}

export function openDatabase(dbPath = resolveDbPath()): Database.Database {
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
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
  return db;
}

export type MetricPoint = {
  ts: number;
  value: number;
  tags: Record<string, string>;
};

export function insertPoints(
  db: Database.Database,
  metric: string,
  points: MetricPoint[],
): number {
  const stmt = db.prepare(
    `INSERT INTO metric_points (metric, ts, value, tags) VALUES (@metric, @ts, @value, @tags)`,
  );
  const insertMany = db.transaction((rows: MetricPoint[]) => {
    for (const row of rows) {
      stmt.run({
        metric,
        ts: row.ts,
        value: row.value,
        tags: JSON.stringify(row.tags ?? {}),
      });
    }
    return rows.length;
  });
  return insertMany(points);
}

export function queryPoints(
  db: Database.Database,
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