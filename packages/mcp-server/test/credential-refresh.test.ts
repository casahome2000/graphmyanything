import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "../src/db.js";
import { HostedClient } from "../src/hosted/client.js";
import {
  callWithCredentialRefresh,
  isApiKeyRejectedError,
  staleApiKeyToolError,
} from "../src/hosted/credential-refresh.js";
import { PACKAGE_VERSION } from "../src/version.js";
import { runTrack, type ToolRuntime } from "../src/tools/runtime.js";
import { createMockHostedApi } from "./hosted-mock.js";
import { HostedApiError } from "../src/hosted/client.js";

describe("isApiKeyRejectedError", () => {
  it("treats 401 HostedApiError as rejected", () => {
    expect(
      isApiKeyRejectedError(
        new HostedApiError("Invalid or revoked API key.", 401),
      ),
    ).toBe(true);
  });

  it("does not treat 503 as rejected", () => {
    expect(
      isApiKeyRejectedError(new HostedApiError("HTTP 503", 503)),
    ).toBe(false);
  });
});

describe("callWithCredentialRefresh", () => {
  let baseUrl: string;
  let close: () => Promise<void>;

  beforeEach(async () => {
    const mock = await createMockHostedApi({
      points: [],
      acceptedApiKeys: ["gma_fresh_key"],
    });
    baseUrl = mock.baseUrl;
    close = mock.close;
  });

  afterEach(async () => {
    await close();
  });

  it("retries once when resolveKey returns a new key", async () => {
    const client = new HostedClient({ apiKey: "gma_stale_key", baseUrl });
  let reads = 0;
    const keys = ["gma_fresh_key", "gma_fresh_key"];
    const result = await callWithCredentialRefresh(
      client,
      (c) => c.track({ metric: "retry.test", value: 1 }),
      () => keys[reads++] ?? keys.at(-1)!,
    );
    expect(result.written).toBe(1);
    expect(reads).toBe(1);
    expect(client.getApiKey()).toBe("gma_fresh_key");
  });

  it("throws stale key guidance when the key unchanged", async () => {
    const client = new HostedClient({ apiKey: "gma_stale_key", baseUrl });
    await expect(
      callWithCredentialRefresh(
        client,
        (c) => c.track({ metric: "x", value: 1 }),
        () => "gma_stale_key",
      ),
    ).rejects.toThrow(staleApiKeyToolError().message);
  });
});

describe("runTrack credential refresh", () => {
  const dbPath = path.join(os.tmpdir(), `gma-refresh-${Date.now()}.db`);

  let baseUrl: string;
  let close: () => Promise<void>;

  beforeEach(async () => {
    const mock = await createMockHostedApi({
      points: [],
      acceptedApiKeys: ["gma_fresh_key"],
    });
    baseUrl = mock.baseUrl;
    close = mock.close;
  });

  afterEach(async () => {
    await close();
    try {
      fs.unlinkSync(dbPath);
    } catch {
      /* ok */
    }
  });

  it("refreshes hosted track after 401 when resolveApiKey hook returns new key", async () => {
    process.env.GRAPHMYANYTHING_API_KEY = "gma_stale_key";
    const db = openDatabase(dbPath);
    const client = new HostedClient({ apiKey: "gma_stale_key", baseUrl });
    let reads = 0;
    const rt: ToolRuntime = {
      mode: "hosted",
      db,
      client,
      skipBacklogUpload: true,
      resolveApiKey: () => {
        reads += 1;
        return "gma_fresh_key";
      },
    };
    const out = await runTrack(rt, { metric: "refresh.track", value: 2 });
    expect(out.written).toBe(1);
    expect(reads).toBeGreaterThanOrEqual(1);
    expect(client.getApiKey()).toBe("gma_fresh_key");
    db.close();
  });

  it("mentions sync and restart when still rejected", async () => {
    const db = openDatabase(dbPath);
    const client = new HostedClient({ apiKey: "gma_stale_key", baseUrl });
    const rt: ToolRuntime = {
      mode: "hosted",
      db,
      client,
      resolveApiKey: () => "gma_stale_key",
    };
    await expect(runTrack(rt, { metric: "bad", value: 1 })).rejects.toThrow(
      PACKAGE_VERSION,
    );
    db.close();
  });
});