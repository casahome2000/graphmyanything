import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, insertPoints, countPoints } from "../src/db.js";
import { runTrack, runQuery, runChart, type ToolRuntime } from "../src/tools/runtime.js";
import { HostedClient } from "../src/hosted/client.js";
import { resolveMode, resolveApiKey } from "../src/mode.js";
import { readConfig, writeConfig } from "../src/config.js";
import { createMockHostedApi } from "./hosted-mock.js";

describe("hosted runtime", () => {
  let baseUrl: string;
  let close: () => Promise<void>;
  const dbPath = path.join(os.tmpdir(), `gma-hosted-${Date.now()}.db`);
  const configPath = path.join(os.tmpdir(), `gma-cfg-${Date.now()}.json`);

  beforeEach(async () => {
    process.env.GRAPHMYANYTHING_API_BASE = undefined;
    process.env.GRAPHMYANYTHING_API_KEY = "gma_test_key";
    process.env.GRAPHMYANYTHING_CONFIG_PATH = configPath;
    process.env.GRAPHMYANYTHING_MODE = undefined;
    const mock = await createMockHostedApi();
    baseUrl = mock.baseUrl;
    close = mock.close;
    process.env.GRAPHMYANYTHING_API_BASE = baseUrl;
  });

  afterEach(async () => {
    await close();
    delete process.env.GRAPHMYANYTHING_API_BASE;
    delete process.env.GRAPHMYANYTHING_API_KEY;
    delete process.env.GRAPHMYANYTHING_CONFIG_PATH;
    delete process.env.GRAPHMYANYTHING_MODE;
    try {
      fs.unlinkSync(dbPath);
    } catch {
      /* ok */
    }
    try {
      fs.unlinkSync(configPath);
    } catch {
      /* ok */
    }
  });

  it("uses API for query and backs up track to local DB", async () => {
    const db = openDatabase(dbPath);
    const client = new HostedClient({
      apiKey: "gma_test_key",
      baseUrl,
    });
    const rt: ToolRuntime = { mode: "hosted", db, client };

    const tracked = await runTrack(rt, { metric: "test.hosted", value: 99 });
    expect(tracked.written).toBe(1);
    expect(countPoints(db, "test.hosted")).toBe(1);

    const q = await runQuery(rt, { metric: "test.hosted" });
    expect(q.m).toBe("test.hosted");

    db.close();
  });

  it("chart returns url and embed fields", async () => {
    const db = openDatabase(dbPath);
    insertPoints(db, "c.m", [{ ts: 1_700_000_000, value: 1, tags: {} }]);
    const rt: ToolRuntime = {
      mode: "hosted",
      db,
      client: new HostedClient({ apiKey: "gma_test_key", baseUrl }),
    };
    const r = await runChart(rt, { metric: "c.m" });
    expect(r.url).toMatch(/graphmyanything\.com\/c\//);
    expect(r.embed_svg).toContain("<svg");
    expect(typeof r.path).toBe("string");
    db.close();
  });

  it("share:false omits url", async () => {
    const db = openDatabase(dbPath);
    insertPoints(db, "c.m", [{ ts: 1_700_000_000, value: 1, tags: {} }]);
    const rt: ToolRuntime = {
      mode: "hosted",
      db,
      client: new HostedClient({ apiKey: "gma_test_key", baseUrl }),
    };
    const r = await runChart(rt, { metric: "c.m", share: false });
    expect(r.url).toBeNull();
    db.close();
  });
});

describe("mode resolution", () => {
  const configPath = path.join(os.tmpdir(), `gma-mode-${Date.now()}.json`);

  afterEach(() => {
    delete process.env.GRAPHMYANYTHING_MODE;
    delete process.env.GRAPHMYANYTHING_API_KEY;
    delete process.env.GRAPHMYANYTHING_CONFIG_PATH;
    try {
      fs.unlinkSync(configPath);
    } catch {
      /* ok */
    }
  });

  it("GRAPHMYANYTHING_MODE=local forces local", () => {
    process.env.GRAPHMYANYTHING_CONFIG_PATH = configPath;
    writeConfig({ api_key: "gma_x", mode: "hosted" });
    process.env.GRAPHMYANYTHING_MODE = "local";
    expect(resolveMode()).toBe("local");
  });

  it("env API key selects hosted", () => {
    process.env.GRAPHMYANYTHING_API_KEY = "gma_env";
    expect(resolveMode()).toBe("hosted");
    expect(resolveApiKey()).toBe("gma_env");
  });

  it("config api_key selects hosted", () => {
    process.env.GRAPHMYANYTHING_CONFIG_PATH = configPath;
    writeConfig({ api_key: "gma_file" });
    expect(resolveMode(readConfig(configPath))).toBe("hosted");
  });
});