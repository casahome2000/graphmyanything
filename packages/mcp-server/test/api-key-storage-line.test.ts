import { afterEach, describe, expect, it, vi } from "vitest";
import * as config from "../src/config.js";
import * as mode from "../src/mode.js";
import { formatApiKeyStorageLine } from "../src/lib/api-key-storage-line.js";

describe("formatApiKeyStorageLine", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports not signed in without a key", () => {
    vi.spyOn(mode, "resolveApiKey").mockReturnValue(undefined);
    expect(formatApiKeyStorageLine()).toBe("API key: not signed in");
  });

  it("reports keychain storage", () => {
    vi.spyOn(mode, "resolveApiKey").mockReturnValue("gma_test");
    vi.spyOn(config, "readConfig").mockReturnValue({
      secret_storage: "keychain",
    });
    expect(formatApiKeyStorageLine()).toBe("API key: stored in OS keychain");
  });

  it("reports file storage with path", () => {
    vi.spyOn(mode, "resolveApiKey").mockReturnValue("gma_test");
    vi.spyOn(config, "readConfig").mockReturnValue({
      secret_storage: "file",
    });
    vi.spyOn(config, "resolveConfigPath").mockReturnValue(
      "/home/user/.graphmyanything/credentials.json",
    );
    expect(formatApiKeyStorageLine()).toBe(
      "API key: file /home/user/.graphmyanything/credentials.json (0600)",
    );
  });
});