import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { openDatabase, insertPoints } from "../src/db.js";
import { handleQuery } from "../src/tools/handlers.js";
import { resolveIncludeSeries } from "../src/lib/terse-summary.js";

describe("resolveIncludeSeries", () => {
  it("auto omits when also_chart", () => {
    expect(resolveIncludeSeries("auto", 500, true).mode).toBe("none");
  });
  it("auto omits on small budget", () => {
    expect(resolveIncludeSeries("auto", 200, false).mode).toBe("none");
  });
  it("auto includes lttb by default", () => {
    expect(resolveIncludeSeries("auto", 500, false).mode).toBe("lttb");
  });
  it("points 0 is none", () => {
    expect(resolveIncludeSeries(0, 500).mode).toBe("none");
  });
});

describe("handleQuery lean", () => {
  const dbPath = path.join(os.tmpdir(), `gma-query-test-${Date.now()}.db`);

  it("returns terse summary without pts when also_chart", () => {
    const db = openDatabase(dbPath);
    insertPoints(
      db,
      "test.m",
      Array.from({ length: 20 }, (_, i) => ({
        ts: 1_700_000_000 + i * 3600,
        value: i * 10,
        tags: {},
      })),
    );
    const r = handleQuery(db, {
      metric: "test.m",
      range: "90d",
      also_chart: true,
      points: "auto",
    });
    expect(r.pts).toBeUndefined();
    expect(r.s).toBeDefined();
    expect(r.m).toBe("test.m");
    db.close();
    fs.unlinkSync(dbPath);
  });

  it("includes pts when points=50", () => {
    const db = openDatabase(dbPath);
    insertPoints(
      db,
      "test.m2",
      Array.from({ length: 100 }, (_, i) => ({
        ts: 1_700_000_000 + i * 3600,
        value: i,
        tags: {},
      })),
    );
    const r = handleQuery(db, {
      metric: "test.m2",
      points: 50,
    });
    expect(Array.isArray(r.pts)).toBe(true);
    expect((r.pts as unknown[]).length).toBeLessThanOrEqual(50);
    db.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {
      /* ok */
    }
  });
});