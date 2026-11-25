import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type GmaMode = "local" | "hosted";

export type GmaConfig = {
  _warning?: string;
  mode?: GmaMode;
  api_key?: string;
  /** Resume offset for batch upload during sync (row id in local DB). */
  sync_after_id?: number;
};

export const CONFIG_SECRET_WARNING = "secret API key, do not share";

const CONFIG_DIR = path.join(os.homedir(), ".graphmyanything");
/** Legacy config filename (still read for backward compatibility). */
export const LEGACY_CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
/** Default credentials file (signals a secret; mode 0600). */
export const DEFAULT_CREDENTIALS_PATH = path.join(CONFIG_DIR, "credentials.json");
/** @deprecated Use {@link DEFAULT_CREDENTIALS_PATH}; kept for existing imports. */
export const DEFAULT_CONFIG_PATH = DEFAULT_CREDENTIALS_PATH;

function loadFile(configPath: string): GmaConfig {
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw) as GmaConfig;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function resolveConfigPath(): string {
  const env = process.env.GRAPHMYANYTHING_CONFIG_PATH?.trim();
  if (env) return path.resolve(env);
  if (fs.existsSync(DEFAULT_CREDENTIALS_PATH)) return DEFAULT_CREDENTIALS_PATH;
  if (fs.existsSync(LEGACY_CONFIG_PATH)) return LEGACY_CONFIG_PATH;
  return DEFAULT_CREDENTIALS_PATH;
}

function resolveWritePath(explicit?: string): string {
  if (explicit) return explicit;
  const env = process.env.GRAPHMYANYTHING_CONFIG_PATH?.trim();
  if (env) return path.resolve(env);
  if (fs.existsSync(DEFAULT_CREDENTIALS_PATH)) return DEFAULT_CREDENTIALS_PATH;
  if (fs.existsSync(LEGACY_CONFIG_PATH)) return DEFAULT_CREDENTIALS_PATH;
  return DEFAULT_CREDENTIALS_PATH;
}

export function readConfig(configPath?: string): GmaConfig {
  if (configPath) return loadFile(configPath);
  const env = process.env.GRAPHMYANYTHING_CONFIG_PATH?.trim();
  if (env) return loadFile(path.resolve(env));
  const credentials = loadFile(DEFAULT_CREDENTIALS_PATH);
  const legacy = loadFile(LEGACY_CONFIG_PATH);
  return { ...legacy, ...credentials };
}

function serializeConfig(merged: GmaConfig): string {
  const { _warning: _drop, ...rest } = merged;
  if (merged.api_key === "") delete rest.api_key;
  const body = {
    _warning: CONFIG_SECRET_WARNING,
    ...rest,
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}

function ensureSecretDir(configPath: string): void {
  fs.mkdirSync(path.dirname(configPath), { recursive: true, mode: 0o700 });
}

export function writeConfig(
  patch: Partial<GmaConfig>,
  configPath?: string,
): GmaConfig {
  const target = resolveWritePath(configPath);
  ensureSecretDir(target);
  const merged = { ...readConfig(), ...patch };
  if (merged.api_key === "") delete merged.api_key;
  fs.writeFileSync(target, serializeConfig(merged), { mode: 0o600 });
  try {
    fs.chmodSync(target, 0o600);
  } catch {
    /* best effort */
  }
  if (
    !process.env.GRAPHMYANYTHING_CONFIG_PATH?.trim() &&
    target === DEFAULT_CREDENTIALS_PATH &&
    fs.existsSync(LEGACY_CONFIG_PATH)
  ) {
    try {
      fs.unlinkSync(LEGACY_CONFIG_PATH);
    } catch {
      /* best effort */
    }
  }
  return merged;
}

export function clearApiKey(configPath?: string): GmaConfig {
  const target = resolveWritePath(configPath);
  const current = readConfig();
  delete current.api_key;
  current.mode = "local";
  ensureSecretDir(target);
  fs.writeFileSync(target, serializeConfig(current), { mode: 0o600 });
  return current;
}