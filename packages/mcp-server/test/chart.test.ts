import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { insertPoints, openDatabase } from "../src/db.js";
import { HOSTED_CHART_URL_NOTE, resolveChartsDir } from "../src/paths.js";
import { handleChart } from "../src/tools/handlers.js";

const envRestore: Record<string, string | undefined> = {};

function setEnv(key: string, value: string | undefined): void {
  if (!(key in envRestore)) envRestore[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

afterEach(() => {
  for (const [key, val] of Object.entries(envRestore)) {
    if (val === undefined) delete process.env[key];
    else process.env[key] = val;
  }
  for (const key of Object.keys(envRestore)) delete envRestore[key];
});

describe("resolveChartsDir", () => {
  it("defaults to ~/.graphmyanything/charts", () => {
    setEnv("GRAPHMYANYTHING_DB_PATH", undefined);
    setEnv("GRAPHMYANYTHING_CHARTS_DIR", undefined);
    expect(resolveChartsDir()).toBe(
      path.join(os.homedir(), ".graphmyanything", "charts"),
    );
  });

  it("uses charts beside custom DB path", () => {
    setEnv("GRAPHMYANYTHING_DB_PATH", "/data/metrics/prod.db");
    setEnv("GRAPHMYANYTHING_CHARTS_DIR", undefined);
    expect(resolveChartsDir()).toBe(path.join("/data/metrics", "charts"));
  });

  it("prefers GRAPHMYANYTHING_CHARTS_DIR", () => {
    setEnv("GRAPHMYANYTHING_DB_PATH", "/data/metrics/prod.db");
    setEnv("GRAPHMYANYTHING_CHARTS_DIR", "/tmp/custom-charts");
    expect(resolveChartsDir()).toBe(path.resolve("/tmp/custom-charts"));
  });
});

describe("handleChart", () => {
  it("returns null url and local path under configured charts dir", () => {
    const base = path.join(os.tmpdir(), `gma-chart-test-${Date.now()}`);
    const dbPath = path.join(base, "metrics.db");
    const chartsDir = path.join(base, "charts");
    setEnv("GRAPHMYANYTHING_DB_PATH", dbPath);
    setEnv("GRAPHMYANYTHING_CHARTS_DIR", undefined);

    const db = openDatabase(dbPath);
    insertPoints(db, "test.metric", [{ ts: 1_700_000_000, value: 10, tags: {} }]);
    const result = handleChart(db, { metric: "test.metric" });
    expect(result.url).toBeNull();
    expect(result.hosted_url_note).toBe(HOSTED_CHART_URL_NOTE);
    expect(result.path.startsWith(chartsDir)).toBe(true);
    expect(fs.existsSync(result.path)).toBe(true);
    db.close();
    fs.rmSync(base, { recursive: true, force: true });
  });
});