import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMockHostedApi, type MockHostedState } from "./hosted-mock.js";
import { HostedClient } from "../src/hosted/client.js";
import { openDatabase, insertPoints, totalPointCount } from "../src/db.js";
import { readConfig, writeConfig } from "../src/config.js";

describe("sync batch upload", () => {
  const state: MockHostedState = { points: [], deviceAuthorized: true };
  let baseUrl: string;
  let close: () => Promise<void>;
  const dbPath = path.join(os.tmpdir(), `gma-sync-${Date.now()}.db`);
  const configPath = path.join(os.tmpdir(), `gma-sync-cfg-${Date.now()}.json`);

  beforeEach(async () => {
    state.points = [];
    process.env.GRAPHMYANYTHING_CONFIG_PATH = configPath;
    process.env.GRAPHMYANYTHING_API_BASE = undefined;
    const mock = await createMockHostedApi(state);
    baseUrl = mock.baseUrl;
    close = mock.close;
    process.env.GRAPHMYANYTHING_API_BASE = baseUrl;
  });

  afterEach(async () => {
    await close();
    delete process.env.GRAPHMYANYTHING_API_BASE;
    delete process.env.GRAPHMYANYTHING_CONFIG_PATH;
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

  it("device token stores api key and batch upload uses resume checkpoint", async () => {
    const db = openDatabase(dbPath);
    insertPoints(
      db,
      "a.m",
      Array.from({ length: 5 }, (_, i) => ({
        ts: 1_700_000_000 + i,
        value: i,
        tags: {},
      })),
    );
    db.close();

    const anon = new HostedClient({ apiKey: "", baseUrl });
    const start = await anon.deviceStart();
    const tok = await anon.deviceToken(start.device_code);
    expect(tok.status).toBe("authorized");
    if (tok.status !== "authorized") return;

    writeConfig({ api_key: tok.api_key, mode: "hosted" });
    expect(readConfig().api_key).toBe("gma_test_key");

    const client = new HostedClient({ apiKey: tok.api_key, baseUrl });
    const account = await client.getAccount();
    expect(account.plan).toBe("pro");

    const db2 = openDatabase(dbPath);
    const total = totalPointCount(db2);
    const batch = await import("../src/db.js").then((m) =>
      m.listPointsAfterId(db2, 0, 1000),
    );
    await client.trackBatch(
      batch.map((r) => ({
        metric: r.metric,
        ts: r.ts,
        value: r.value,
        tags: r.tags,
      })),
    );
    db2.close();

    expect(state.points.length).toBe(total);
  });
});