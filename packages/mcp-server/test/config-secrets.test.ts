import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  CONFIG_SECRET_WARNING,
  readConfig,
  writeConfig,
} from "../src/config.js";

describe("credentials file", () => {
  const prev = process.env.GRAPHMYANYTHING_CONFIG_PATH;
  let tmpDir: string;

  afterEach(() => {
    if (prev === undefined) delete process.env.GRAPHMYANYTHING_CONFIG_PATH;
    else process.env.GRAPHMYANYTHING_CONFIG_PATH = prev;
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes mode 0600 JSON with _warning and masks key in structure", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gma-cfg-"));
    const cfgPath = path.join(tmpDir, "credentials.json");
    process.env.GRAPHMYANYTHING_CONFIG_PATH = cfgPath;

    writeConfig({ api_key: "gma_test_write_key", mode: "hosted" });
    const stat = fs.statSync(cfgPath);
    expect(stat.mode & 0o777).toBe(0o600);
    const raw = JSON.parse(fs.readFileSync(cfgPath, "utf8")) as Record<string, unknown>;
    expect(raw._warning).toBe(CONFIG_SECRET_WARNING);
    expect(raw.api_key).toBe("gma_test_write_key");
    expect(readConfig().api_key).toBe("gma_test_write_key");
  });
});