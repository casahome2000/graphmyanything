import { readConfig, type GmaConfig, type GmaMode } from "./config.js";
import { getStoredApiKey } from "./secrets/store.js";

export function resolveMode(config: GmaConfig = readConfig()): GmaMode {
  const forced = process.env.GRAPHMYANYTHING_MODE?.trim().toLowerCase();
  if (forced === "local") return "local";

  const envKey = resolveEnvApiKey();
  if (envKey) return "hosted";

  const stored = getStoredApiKey();
  if (config.mode === "hosted" && stored) return "hosted";
  if (stored) return "hosted";

  return "local";
}

function resolveEnvApiKey(): string | undefined {
  const primary = process.env.GRAPHMYANYTHING_API_KEY?.trim();
  if (primary) return primary;
  return process.env.GMA_API_KEY?.trim() || undefined;
}

export function resolveApiKey(config: GmaConfig = readConfig()): string | undefined {
  const envKey = resolveEnvApiKey();
  if (envKey) return envKey;
  return getStoredApiKey();
}