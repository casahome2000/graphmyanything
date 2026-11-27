import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runSelfTest } from "../src/cli/self-test.js";
import { PACKAGE_VERSION } from "../src/version.js";
import { writeConfig } from "../src/config.js";
import { createMockHostedApi } from "./hosted-mock.js";

describe("runSelfTest hosted API messaging", () => {
  const configPath = path.join(os.tmpdir(), `gma-selftest-${Date.now()}.json`);
  let baseUrl: string;
  let close: () => Promise<void>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    process.env.GRAPHMYANYTHING_CONFIG_PATH = configPath;
    process.env.GRAPHMYANYTHING_API_KEY = undefined;
    delete process.env.GMA_API_KEY;
    writeConfig({ mode: "hosted", api_key: "gma_test_key", secret_storage: "file" });
    const mock = await createMockHostedApi({
      points: [],
      forceAccount401: true,
    });
    baseUrl = mock.baseUrl;
    close = mock.close;
    process.env.GRAPHMYANYTHING_API_BASE = baseUrl;
    stderrSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    await close();
    stderrSpy.mockRestore();
    delete process.env.GRAPHMYANYTHING_API_BASE;
    delete process.env.GRAPHMYANYTHING_CONFIG_PATH;
    try {
      fs.unlinkSync(configPath);
    } catch {
      /* ok */
    }
  });

  it("reports API key rejected with sync next step on 401", async () => {
    const code = await runSelfTest();
    expect(code).toBe(1);
    const lines = stderrSpy.mock.calls.map((c) => String(c[0]));
    expect(lines).toContainEqual(
      "Hosted API: API key rejected (revoked or from a deleted account)",
    );
    expect(lines).toContainEqual(
      `Next: npx -y graphmyanything-mcp@${PACKAGE_VERSION} sync`,
    );
    expect(lines.some((l) => l.includes("unreachable"))).toBe(false);
  });
});