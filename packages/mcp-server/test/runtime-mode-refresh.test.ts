import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "../src/db.js";
import { HostedClient } from "../src/hosted/client.js";
import { chartShareRequiresSignInMessage } from "../src/lib/chart-hosted.js";
import {
  refreshToolRuntime,
  resetRuntimeResolveCacheForTests,
} from "../src/lib/runtime-resolve.js";
import { writeConfig } from "../src/config.js";
import {
  resetRuntimeSessionForTests,
  runChart,
  runTrack,
  type ToolRuntime,
} from "../src/tools/runtime.js";
import {
  setKeychainBackendForTests,
  setStoredApiKey,
} from "../src/secrets/store.js";
import { createMockHostedApi } from "./hosted-mock.js";

describe("lazy hosted mode refresh", () => {
  const configPath = path.join(
    os.tmpdir(),
    `gma-mode-refresh-${Date.now()}.json`,
  );
  const dbPath = path.join(os.tmpdir(), `gma-mode-refresh-${Date.now()}.db`);

  let baseUrl: string;
  let close: () => Promise<void>;
  let store: { key?: string };

  beforeEach(async () => {
    resetRuntimeResolveCacheForTests();
    resetRuntimeSessionForTests();
    delete process.env.GRAPHMYANYTHING_API_KEY;
    delete process.env.GMA_API_KEY;
    delete process.env.GRAPHMYANYTHING_MODE;
    process.env.GRAPHMYANYTHING_CONFIG_PATH = configPath;
    try {
      fs.unlinkSync(configPath);
    } catch {
      /* ok */
    }
    writeConfig({ mode: "local" });
    store = {};
    setKeychainBackendForTests({
      name: "test",
      isAvailable: () => true,
      get: () => store.key,
      set: (k) => {
        store.key = k;
        return true;
      },
      delete: () => {
        delete store.key;
        return true;
      },
    });
    const mock = await createMockHostedApi({
      points: [],
      acceptedApiKeys: ["gma_hot_key"],
    });
    baseUrl = mock.baseUrl;
    close = mock.close;
    process.env.GRAPHMYANYTHING_API_BASE = baseUrl;
  });

  afterEach(async () => {
    await close();
    setKeychainBackendForTests(null);
    delete process.env.GRAPHMYANYTHING_API_BASE;
    delete process.env.GRAPHMYANYTHING_CONFIG_PATH;
    delete process.env.GRAPHMYANYTHING_MODE;
    try {
      fs.unlinkSync(configPath);
    } catch {
      /* ok */
    }
    try {
      fs.unlinkSync(dbPath);
    } catch {
      /* ok */
    }
  });

  it("switches to hosted on next tool call after credentials are stored", async () => {
    const db = openDatabase(dbPath);
    const rt: ToolRuntime = {
      mode: "local",
      db,
      client: undefined,
      skipBacklogUpload: true,
    };
    refreshToolRuntime(rt);
    expect(rt.mode).toBe("local");
    expect(rt.client).toBeUndefined();

    const localOnly = await runTrack(rt, { metric: "hot.mode", value: 1 });
    expect(localOnly.written).toBe(1);
    expect(rt.mode).toBe("local");

    setStoredApiKey("gma_hot_key");
    resetRuntimeResolveCacheForTests();

    const after = await runTrack(rt, { metric: "hot.mode", value: 2 });
    expect(rt.mode).toBe("hosted");
    expect(rt.client).toBeInstanceOf(HostedClient);
    expect(after.written).toBe(1);

    const shared = await runChart(rt, {
      metric: "hot.mode",
      share: true,
    });
    expect(shared.url).toMatch(/graphmyanything\.com\/c\//);
    db.close();
  });

  it("chart share:true in local mode without creds throws sync message", async () => {
    const db = openDatabase(dbPath);
    const rt: ToolRuntime = { mode: "local", db, client: undefined };
    await expect(
      runChart(rt, { metric: "x", share: true }),
    ).rejects.toThrow(chartShareRequiresSignInMessage());
    db.close();
  });

  it("honors GRAPHMYANYTHING_MODE=local when credentials exist", async () => {
    setStoredApiKey("gma_hot_key");
    process.env.GRAPHMYANYTHING_MODE = "local";
    resetRuntimeResolveCacheForTests();
    const db = openDatabase(dbPath);
    const rt: ToolRuntime = { mode: "local", db, client: undefined };
    await runTrack(rt, { metric: "stay.local", value: 1 });
    expect(rt.mode).toBe("local");
    expect(rt.client).toBeUndefined();
    db.close();
  });
});