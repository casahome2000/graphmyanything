import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  pickKeychainBackend,
  type KeychainBackend,
} from "../src/secrets/keychain-backend.js";
import {
  getStoredApiKey,
  setKeychainBackendForTests,
  setStoredApiKey,
  clearStoredApiKey,
} from "../src/secrets/store.js";

function memoryBackend(): KeychainBackend {
  let value: string | undefined;
  return {
    name: "memory",
    isAvailable: () => true,
    get: () => value,
    set: (k) => {
      value = k;
      return true;
    },
    delete: () => {
      value = undefined;
      return true;
    },
  };
}

describe("secrets store", () => {
  const prev = process.env.GRAPHMYANYTHING_CONFIG_PATH;
  let tmpDir: string;

  afterEach(() => {
    setKeychainBackendForTests(null);
    if (prev === undefined) delete process.env.GRAPHMYANYTHING_CONFIG_PATH;
    else process.env.GRAPHMYANYTHING_CONFIG_PATH = prev;
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("stores in keychain and omits api_key from credentials file", () => {
    setKeychainBackendForTests(memoryBackend());
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gma-sec-"));
    process.env.GRAPHMYANYTHING_CONFIG_PATH = path.join(
      tmpDir,
      "credentials.json",
    );
    setStoredApiKey("gma_test_keychain_store_value");
    expect(getStoredApiKey()).toBe("gma_test_keychain_store_value");
    const raw = JSON.parse(
      fs.readFileSync(process.env.GRAPHMYANYTHING_CONFIG_PATH!, "utf8"),
    ) as Record<string, unknown>;
    expect(raw.api_key).toBeUndefined();
    expect(raw.secret_storage).toBe("keychain");
  });

  it("migrates file key into keychain", () => {
    setKeychainBackendForTests(memoryBackend());
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gma-mig-"));
    const cfg = path.join(tmpDir, "credentials.json");
    process.env.GRAPHMYANYTHING_CONFIG_PATH = cfg;
    fs.writeFileSync(
      cfg,
      JSON.stringify({ api_key: "gma_migrate_me", mode: "hosted" }),
    );
    expect(getStoredApiKey()).toBe("gma_migrate_me");
    const raw = JSON.parse(fs.readFileSync(cfg, "utf8")) as Record<string, unknown>;
    expect(raw.api_key).toBeUndefined();
  });

  it("on Windows keeps api_key on disk (no keychain backend)", () => {
    const platform = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "win32" });
    setKeychainBackendForTests(null);
    try {
      expect(pickKeychainBackend()).toBeUndefined();
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gma-win-"));
      process.env.GRAPHMYANYTHING_CONFIG_PATH = path.join(
        tmpDir,
        "credentials.json",
      );
      setStoredApiKey("gma_windows_file_only_key");
      expect(getStoredApiKey()).toBe("gma_windows_file_only_key");
      const raw = JSON.parse(
        fs.readFileSync(process.env.GRAPHMYANYTHING_CONFIG_PATH!, "utf8"),
      ) as Record<string, unknown>;
      expect(raw.api_key).toBe("gma_windows_file_only_key");
      expect(raw.secret_storage).toBe("file");
    } finally {
      if (platform) Object.defineProperty(process, "platform", platform);
      else delete (process as { platform?: string }).platform;
    }
  });

  it("clears keychain and config", () => {
    setKeychainBackendForTests(memoryBackend());
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gma-clr-"));
    process.env.GRAPHMYANYTHING_CONFIG_PATH = path.join(
      tmpDir,
      "credentials.json",
    );
    setStoredApiKey("gma_clear_test");
    clearStoredApiKey();
    expect(getStoredApiKey()).toBeUndefined();
  });
});