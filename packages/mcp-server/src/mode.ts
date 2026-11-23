import { readConfig, type GmaConfig, type GmaMode } from "./config.js";

export function resolveMode(config: GmaConfig = readConfig()): GmaMode {
  const forced = process.env.GRAPHMYANYTHING_MODE?.trim().toLowerCase();
  if (forced === "local") return "local";

  const envKey = process.env.GRAPHMYANYTHING_API_KEY?.trim();
  if (envKey) return "hosted";

  if (config.mode === "hosted" && config.api_key?.trim()) return "hosted";
  if (config.api_key?.trim()) return "hosted";

  return "local";
}

export function resolveApiKey(config: GmaConfig = readConfig()): string | undefined {
  const envKey = process.env.GRAPHMYANYTHING_API_KEY?.trim();
  if (envKey) return envKey;
  const fromFile = config.api_key?.trim();
  return fromFile || undefined;
}