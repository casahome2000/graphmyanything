import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  countPoints,
  migrateUniqueMetricTs,
  openDatabase,
  queryPoints,
  upsertPoints,
} from "../src/db.js";
import { handleForget, handleTrack } from "../src/tools/handlers.js";

function legacyDbPath(): string {
  return path.join(os.tmpdir(), `gma-legacy-${Date.now()}-${Math.random()}.db`);
}

describe("migrateUniqueMetricTs", () => {
  it("dedupes existing rows and adds UNIQUE(metric, ts)", () => {
    const dbPath = legacyDbPath();
    const db = new DatabaseSync(dbPath);
    db.exec(`
      CREATE TABLE metric_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric TEXT NOT NULL,
        ts INTEGER NOT NULL,
        value REAL NOT NULL,
        tags TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
    `);
    const ins = db.prepare(
      `INSERT INTO metric_points (metric, ts, value, tags) VALUES (?, ?, ?, '{}')`,
    );
    ins.run("test.dup", 1000, 1);
    ins.run("test.dup", 1000, 2);
    ins.run("test.dup", 2000, 5);

    migrateUniqueMetricTs(db);

    const rows = queryPoints(db, "test.dup");
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.ts === 1000)?.value).toBe(2);
    db.close();
    fs.unlinkSync(dbPath);
  });
});

describe("upsertPoints", () => {
  const dbPath = legacyDbPath();

  it("replaces same metric+ts instead of duplicating", () => {
    const db = openDatabase(dbPath);
    const first = upsertPoints(db, "github.stars.modelcontextprotocol.servers", [
      { ts: 1732147200, value: 92_100, tags: {} },
    ]);
    expect(first).toEqual({ written: 1, replaced: 0 });

    const second = upsertPoints(db, "github.stars.modelcontextprotocol.servers", [
      { ts: 1732147200, value: 92_180, tags: { note: "fix" } },
    ]);
    expect(second).toEqual({ written: 0, replaced: 1 });
    expect(queryPoints(db, "github.stars.modelcontextprotocol.servers")).toHaveLength(1);
    expect(queryPoints(db, "github.stars.modelcontextprotocol.servers")[0].value).toBe(92_180);
    db.close();
    fs.unlinkSync(dbPath);
  });
});

describe("handleTrack", () => {
  it("returns written and replaced counts", () => {
    const dbPath = legacyDbPath();
    const db = openDatabase(dbPath);
    const a = handleTrack(db, {
      metric: "m.a",
      value: 10,
    });
    expect(a.written).toBe(1);
    expect(a.replaced).toBe(0);
    const ts = queryPoints(db, "m.a")[0].ts;
    const b = handleTrack(db, {
      metric: "m.a",
      points: [{ ts, value: 11 }],
    });
    expect(b.written).toBe(0);
    expect(b.replaced).toBe(1);
    db.close();
    fs.unlinkSync(dbPath);
  });
});

describe("handleForget", () => {
  const dbPath = legacyDbPath();

  it("deletes a single point by ts", () => {
    const db = openDatabase(dbPath);
    handleTrack(db, {
      metric: "m.del",
      points: [
        { ts: 100, value: 1 },
        { ts: 200, value: 2 },
      ],
    });
    const r = handleForget(db, { metric: "m.del", ts: 100 });
    expect(r.deleted).toBe(1);
    expect(countPoints(db, "m.del")).toBe(1);
    db.close();
    fs.unlinkSync(dbPath);
  });

  it("deletes a time range", () => {
    const db = openDatabase(dbPath);
    handleTrack(db, {
      metric: "m.range",
      points: [
        { ts: 10, value: 1 },
        { ts: 20, value: 2 },
        { ts: 30, value: 3 },
      ],
    });
    const r = handleForget(db, { metric: "m.range", from: 15, to: 25 });
    expect(r.deleted).toBe(1);
    expect(queryPoints(db, "m.range").map((p) => p.ts)).toEqual([10, 30]);
    db.close();
    fs.unlinkSync(dbPath);
  });

  it("requires confirm for whole-metric delete", () => {
    const db = openDatabase(dbPath);
    handleTrack(db, { metric: "m.all", value: 1 });
    expect(() => handleForget(db, { metric: "m.all", all: true })).toThrow(
      /confirm:true.*all: true, confirm: true/,
    );
    const r = handleForget(db, {
      metric: "m.all",
      all: true,
      confirm: true,
    });
    expect(r.deleted).toBe(1);
    expect(countPoints(db, "m.all")).toBe(0);
    db.close();
    fs.unlinkSync(dbPath);
  });

  it("rejects delete without metric modes", () => {
    const db = openDatabase(dbPath);
    expect(() => handleForget(db, { metric: "m.x" })).toThrow();
    db.close();
    fs.unlinkSync(dbPath);
  });
});