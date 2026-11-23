import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type GmaMode = "local" | "hosted";

export type GmaConfig = {
  mode?: GmaMode;
  api_key?: string;
  /** Resume offset for batch upload during sync (row id in local DB). */
  sync_after_id?: number;
};

const CONFIG_DIR = path.join(os.homedir(), ".graphmyanything");
export const DEFAULT_CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export function resolveConfigPath(): string {
  const env = process.env.GRAPHMYANYTHING_CONFIG_PATH?.trim();
  return env ? path.resolve(env) : DEFAULT_CONFIG_PATH;
}

export function readConfig(configPath = resolveConfigPath()): GmaConfig {
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw) as GmaConfig;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function writeConfig(
  patch: Partial<GmaConfig>,
  configPath = resolveConfigPath(),
): GmaConfig {
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const merged = { ...readConfig(configPath), ...patch };
  if (merged.api_key === "") delete merged.api_key;
  const body = `${JSON.stringify(merged, null, 2)}\n`;
  fs.writeFileSync(configPath, body, { mode: 0o600 });
  try {
    fs.chmodSync(configPath, 0o600);
  } catch {
    /* best effort */
  }
  return merged;
}

export function clearApiKey(configPath = resolveConfigPath()): GmaConfig {
  const current = readConfig(configPath);
  delete current.api_key;
  current.mode = "local";
  fs.mkdirSync(path.dirname(configPath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(configPath, `${JSON.stringify(current, null, 2)}\n`, {
    mode: 0o600,
  });
  return current;
}