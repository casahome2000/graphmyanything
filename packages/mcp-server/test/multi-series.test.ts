import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { insertPoints, openDatabase } from "../src/db.js";
import { HostedClient } from "../src/hosted/client.js";
import { generateMultiSeriesInsight } from "../src/lib/multi-series-insight.js";
import { handleChart, handleInsight } from "../src/tools/handlers.js";

const day = 86_400;
const t0 = 1_700_000_000;

describe("generateMultiSeriesInsight", () => {
  it("returns comparison and correlation for two aligned series", () => {
    const a = Array.from({ length: 10 }, (_, i) => ({
      ts: t0 + i * day,
      value: 100 + i * 2,
    }));
    const b = Array.from({ length: 10 }, (_, i) => ({
      ts: t0 + i * day,
      value: 50 + i,
    }));
    const out = generateMultiSeriesInsight("30d", [
      { name: "metric.a", label: "A", points: a },
      { name: "metric.b", label: "B", points: b },
    ]);
    expect(out.multi_metric).toBe(true);
    expect(out.comparison?.rank_by_latest?.length).toBe(2);
    expect(
      Object.keys(out.comparison?.share_of_combined_latest_pct ?? {}).length,
    ).toBe(2);
    expect(out.correlation?.pairs.length).toBeGreaterThan(0);
    expect(out.correlation?.caveat).toMatch(/causation/i);
    expect(out.metrics).toEqual(["metric.a", "metric.b"]);
    expect(out.per_series["metric.a"]).toBeDefined();
  });

  it("single series keeps base insight shape", () => {
    const out = generateMultiSeriesInsight("7d", [
      { name: "only", label: "Only", points: [{ ts: 1, value: 1 }] },
    ]);
    expect(out.metrics?.[0]).toBe("only");
    expect(out.multi_metric).toBeUndefined();
  });
});

describe("local multi-series tools", () => {
  it("handleInsight with metrics returns multi_metric fields", () => {
    const dbPath = path.join(os.tmpdir(), `gma-multi-ins-${Date.now()}.db`);
    const db = openDatabase(dbPath);
    for (let i = 0; i < 8; i++) {
      insertPoints(db, "a.m", [{ ts: t0 + i * day, value: 10 + i, tags: {} }]);
      insertPoints(db, "b.m", [{ ts: t0 + i * day, value: 20 + i * 2, tags: {} }]);
    }
    const r = handleInsight(db, { metrics: ["a.m", "b.m"], range: "30d" });
    expect(r.multi_metric).toBe(true);
    expect(r.per_series).toBeDefined();
    db.close();
    fs.unlinkSync(dbPath);
  });

  it("handleChart with metrics writes multi-series SVG with legend", () => {
    const base = path.join(os.tmpdir(), `gma-multi-ch-${Date.now()}`);
    fs.mkdirSync(base, { recursive: true });
    const dbPath = path.join(base, "m.db");
    process.env.GRAPHMYANYTHING_DB_PATH = dbPath;
    const db = openDatabase(dbPath);
    for (let i = 0; i < 5; i++) {
      insertPoints(db, "x.m", [{ ts: t0 + i * day, value: i, tags: {} }]);
      insertPoints(db, "y.m", [{ ts: t0 + i * day, value: i * 2, tags: {} }]);
    }
    const r = handleChart(db, { metrics: ["x.m", "y.m"] });
    const svg = fs.readFileSync(r.path, "utf8");
    expect(svg).toContain("<svg");
    expect(svg.match(/<text/g)?.length ?? 0).toBeGreaterThan(2);
    db.close();
    fs.rmSync(base, { recursive: true, force: true });
    delete process.env.GRAPHMYANYTHING_DB_PATH;
  });
});

describe("HostedClient series query", () => {
  it("appends repeated metrics query params", () => {
    const client = new HostedClient({ apiKey: "test" });
    const qs = (
      client as unknown as {
        seriesQueryString: (a: object, keys: string[]) => string;
      }
    ).seriesQueryString({ metrics: ["a.m", "b.m"], range: "7d" }, ["range"]);
    expect(qs).toContain("metrics=a.m");
    expect(qs).toContain("metrics=b.m");
    expect(qs).toContain("range=7d");
  });
});