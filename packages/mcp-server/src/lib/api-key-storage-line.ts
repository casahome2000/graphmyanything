import { readConfig, resolveConfigPath } from "../config.js";
import { getStoredApiKey } from "../secrets/store.js";
import { resolveApiKey } from "../mode.js";

function fromEnv(): boolean {
  return Boolean(
    process.env.GRAPHMYANYTHING_API_KEY?.trim() ||
      process.env.GMA_API_KEY?.trim(),
  );
}

/** One-line doctor output: where the API key is stored (never the secret). */
export function formatApiKeyStorageLine(): string {
  if (!resolveApiKey()) return "API key: not signed in";

  const config = readConfig();
  if (config.secret_storage === "keychain") {
    return "API key: stored in OS keychain";
  }
  if (config.secret_storage === "file" || config.api_key?.trim()) {
    return `API key: file ${resolveConfigPath()} (0600)`;
  }
  if (getStoredApiKey()) {
    return "API key: stored in OS keychain";
  }
  if (fromEnv()) {
    return "API key: stored in OS keychain";
  }
  return "API key: not signed in";
}